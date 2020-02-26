import { inject, Container } from "inversify";
import Telegraf, { ContextMessageUpdate, Middleware, session, Markup, Extra, Composer } from "telegraf";
import { User as TelegramUser } from "telegraf/typings/telegram-types";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { getRepository, Repository } from "typeorm";

import { Constants, MetadataKeys, Injections, LogCategories } from "#/constants";
import { ControllerConstructor } from "#/controllers";
import { controllers } from "#/controllers/export";
import { CommandHandlerInfo, EventHandlerInfo, MessageHandler, MessageHandlerContext, ActionHandlerInfo, ControllerMethodContext } from "#/definitions";
import { Service } from "#/decorators";
import { Group, Metadata, Update, User } from "#/entities";
import { IBotService, IDatabaseService, ILoggerService, II18nService } from "#/services";
import { delay } from "#/utils";
import { GroupController } from "#/controllers/GroupController";
import { IUserRepository } from "#/repositories";

@Service(Injections.BotService)
export class BotServiceImpl implements IBotService {
    private bot: Telegraf<ContextMessageUpdate>;

    private botInfo?: TelegramUser;
    get info() {
        if (!this.botInfo) {
            throw new Error("The bot is not running");
        }

        return this.botInfo;
    }

    private _isRunning: boolean = false;
    public get isRunning() {
        return this._isRunning;
    }

    get api() {
        return this.bot.telegram;
    }

    private updateRepo?: Repository<Update>;

    constructor(@inject(Injections.DatabaseService) private databaseService: IDatabaseService,
        @inject(Injections.LoggerService) private logger: ILoggerService,
        @inject(Injections.I18nService) private i18nService: II18nService,
        @inject(Injections.Container) private container: Container) {
        console.assert(process.env.BOT_TOKEN);

        const agent = process.env.HTTPS_PROXY_HOST && process.env.HTTPS_PROXY_PORT ?
            new HttpsProxyAgent({
                host: process.env.HTTPS_PROXY_HOST,
                port: process.env.HTTPS_PROXY_PORT
            }) :
            process.env.SOCKS_PROXY ?
                new SocksProxyAgent(process.env.SOCKS_PROXY)
                : undefined;

        this.bot = new Telegraf<ContextMessageUpdate>(process.env.BOT_TOKEN!, {
            telegram: { agent: agent ? Object.assign(agent, { options: {} }) : undefined },
        });

        this.bot.use(session());

        this.bot.use((ctx, next) => {
            const context = this.createContext(ctx);
            Reflect.defineMetadata(MetadataKeys.Context, context, ctx);

            console.log("Update", ctx.update);

            if (!this.updateRepo) {
                this.updateRepo = getRepository(Update);
            }

            const update = new Update();
            update.id = ctx.update.update_id;
            update.content = ctx.update;

            this.updateRepo.save(update);

            if (next) return next();
        });
        this.bot.use(async (ctx, next) => {
            const start = new Date().getTime();
            if (next) await next()
            const ms = new Date().getTime() - start;

            console.log('Response time: %sms', ms);
        });
        this.bot.use(Composer.mount(["message", "callback_query"], this.i18nService.middleware()));
        this.bot.catch((err: any, ctx: ContextMessageUpdate) => {
            const { reply } = ctx;

            this.logger.error(LogCategories.TelegramUpdate, err);

            if (err instanceof Error && err.message) {
                reply("Unhandled error: " + err.message);
            } else {
                reply("Unhandled error: " + err);
            }
        });
        this.bot.start(async ctx => {
            const { message, i18n } = ctx;
            const { startPayload } = ctx as any;

            const userRepo = container.getNamed<IUserRepository>(Injections.Repository, User.name);
            await userRepo.ensureUser(message!.from!.id, message!.from!.username);

            do {
                if (!startPayload) {
                    break;
                }

                const groupId = Number.parseInt(startPayload);
                if (Number.isNaN(groupId)) {
                    break;
                }

                const controller = container.getNamed<GroupController>(Injections.Controller, GroupController.name);

                if (await controller.joinGroupWithStartPayload(ctx as MessageHandlerContext, startPayload)) {
                    return;
                }
            } while (false);

            ctx.telegram.sendMessage(ctx.chat!.id, i18n.t("startReply"), { parse_mode: 'Markdown', disable_web_page_preview: true });
        });
        this.bot.help(ctx => {
            const { i18n } = ctx;
            ctx.replyWithMarkdown(i18n.t("help.title"), Markup.inlineKeyboard([
                [Markup.callbackButton(i18n.t("help.whoAreYou"), "help1")],
                [Markup.callbackButton(i18n.t("help.whatIsTheFanGroup"), "help2")],
                [Markup.callbackButton(i18n.t("help.instruction"), "help3")],
                [Markup.callbackButton(i18n.t("help.joinFanGroup"), "help4")],
                [Markup.callbackButton(i18n.t("help.createFanGroup"), "help5")],
                [Markup.callbackButton(i18n.t("help.deleteFanGroup"), "help6")],
                [Markup.callbackButton(i18n.t("help.videoTutorial"), "help7")],
                [Markup.callbackButton(i18n.t("help.redEnvelope"), "help8")],
                [Markup.callbackButton(i18n.t("help.diceGames"), "help11")],
                [Markup.callbackButton(i18n.t("help.transfer"), "help9")],
                [Markup.callbackButton(i18n.t("help.otherQuestions"), "help10")],
            ]).extra());
        });

        this.processControllers(controllers);

        this.bot.on("message", ctx => {
            const { message, i18n } = ctx;
            if (!message) {
                throw new Error("What happended?");
            }

            if (message.chat.type !== "private") {
                return;
            }

            ctx.reply(i18n.t("messageReply"));
        });
    }

    private createContext(ctx: ContextMessageUpdate) {
        return {
            ctx,
            container: this.container.createChild(),
        };
    }

    private processControllers(constructors: ControllerConstructor[]) {
        for (const constructor of constructors) {
            const { name } = constructor;

            if (this.container.isBoundNamed(Injections.Controller, name)) {
                console.error("Duplicated controller name:", name);
                process.exit(1);
            }

            this.container.bind(Injections.Controller).to(constructor).whenTargetNamed(name);
        }

        const commandMapping = new Map<string, ControllerConstructor>();

        for (const constructor of constructors) {
            const { prototype } = constructor;
            const prefix = Reflect.getMetadata(MetadataKeys.ControllerPrefix, constructor);
            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as CommandHandlerInfo[] ?? [];
            const events = Reflect.getMetadata(MetadataKeys.EventNames, constructor) as EventHandlerInfo[] ?? [];
            const actions = Reflect.getMetadata(MetadataKeys.ActionNames, constructor) as ActionHandlerInfo[] ?? [];

            for (const { name, methodName, ignorePrefix } of commands) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                const commandName = prefix === "/" || ignorePrefix ? name : (prefix + name);

                const ownerController = commandMapping.get(commandName);
                if (ownerController && ownerController !== constructor) {
                    throw new Error(`Command '${commandName}' is registered by other controller`);
                }

                commandMapping.set(commandName, constructor);

                this.bot.command(commandName, this.handlerFactory(constructor.name, methodName));
            }

            for (const { name, methodName } of events) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                this.bot.on(name, this.handlerFactory(constructor.name, methodName));
            }

            for (const { name, methodName } of actions) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                this.bot.action(name, this.handlerFactory(constructor.name, methodName));
            }
        }
    }
    private handlerFactory(controllerName: string, methodName: string) {
        return (ctx: ContextMessageUpdate) => {
            const { message, callbackQuery, from } = ctx;

            if (!message && !callbackQuery) {
                throw new Error("What happended?");
            }
            if (!from) {
                throw new Error("What happended?");
            }

            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;

            context.container.bind<ControllerMethodContext>(Injections.Context).toConstantValue(context);

            const controller = context.container.getNamed<any>(Injections.Controller, controllerName);
            const handler = controller[methodName] as MessageHandler;

            const result = handler.call(controller, ctx as MessageHandlerContext);
            if (result instanceof Promise) {
                return result;
            }

            return undefined;
        }
    }

    async run() {
        await this.databaseService.ensureDatabase();

        await this.checkBotOwner();

        await delay(2000);

        const isWebhookMode = process.env.WEBHOOK_PORT && process.env.WEBHOOK_URL;

        if (isWebhookMode) {
            // Start In the Webhook mode, Use caddy or other HTTPS Server to proxy the webhook
            await this.bot.startWebhook('/', null, Number(process.env.WEBHOOK_PORT!))
            await this.bot.telegram.setWebhook(process.env.WEBHOOK_URL!);
        } else {
            // Not Detected, going to getUpdate polling
            await this.bot.startPolling();
        }

        this._isRunning = true;
        console.log(`Matataki bot is running in ${isWebhookMode ? "Webhook" : "getUpdate Polling"} Mode...`);
    }

    async checkBotOwner() {
        this.botInfo = await this.bot.telegram.getMe();

        const metadataRepo = getRepository(Metadata);

        let botInfo = await metadataRepo.findOne("bot_info");
        if (!botInfo) {
            botInfo = new Metadata();
            botInfo.name = "bot_info";
            botInfo.value = {
                id: this.botInfo.id,
            };

            await metadataRepo.save(botInfo);
            return;
        }

        if (botInfo.value.id === this.botInfo.id) {
            this.bot.options.username = this.botInfo.username;
            return;
        }

        console.error("您的机器人信息对不上当前的数据库 schema，请把 ormconfig.js 的 schema 改成别的然后做 migrations 再运行机器人");

        process.exit();
    }

    getMeInGroup(group: Group) {
        return this.bot.telegram.getChatMember(group.id, this.info.id);
    }
    getMember(groupId: number, memberId: number) {
        return this.bot.telegram.getChatMember(groupId, memberId);
    }
    kickMember(groupId: number, memberId: number) {
        return this.bot.telegram.kickChatMember(groupId, memberId);
    }

    getGroupInfo(group: Group) {
        return this.bot.telegram.getChat(group.id);
    }
    getGroupInfos(groups: Group[]) {
        return Promise.all(groups.map(async group => {
            const groupId = Number(group.id);
            const info = await this.bot.telegram.getChat(groupId);
            if (!info.title) {
                throw new Error("What happened?");
            }

            return info;
        }));
    }

    sendMessage(memberId: number, message: string) {
        return this.bot.telegram.sendMessage(memberId, message, { parse_mode: "Markdown" });
    }
}
