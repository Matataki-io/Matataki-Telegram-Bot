import { inject, Container } from "inversify";
import Telegraf, { ContextMessageUpdate, Middleware, session } from "telegraf";
import { User } from "telegraf/typings/telegram-types";

import { Constants, MetadataKeys, Injections } from "#/constants";
import { ControllerConstructor, controllers } from "#/controllers";
import { CommandHandlerInfo, EventHandlerInfo, MessageHandler, MessageHandlerContext } from "#/definitions";
import { Service } from "#/decorators";
import { Group } from "#/entities";
import { delay } from "#/utils";

import { IBotService, IDatabaseService } from "#/services";

@Service(Injections.BotService)
export class BotServiceImpl implements IBotService {
    private bot: Telegraf<ContextMessageUpdate>;

    private _botInfo?: User;
    get botInfo() {
        if (!this._botInfo) {
            throw new Error("The bot is not running");
        }

        return this._botInfo;
    }

    private _isRunning: boolean = false;
    public get isRunning() {
        return this._isRunning;
    }

    constructor(@inject(Injections.DatabaseService) private databaseService: IDatabaseService,
        @inject(Injections.Container) private container: Container) {
        console.assert(process.env.BOT_TOKEN);

        this.bot = new Telegraf<ContextMessageUpdate>(process.env.BOT_TOKEN!)

        this.bot.use(session());

        this.bot.use((ctx, next) => {
            const context = this.createContext(ctx);
            Reflect.defineMetadata(MetadataKeys.Context, context, ctx);

            if (next) return next();
        });
        this.bot.use(async (ctx, next) => {
            const start = new Date().getTime();
            if (next) await next()
            const ms = new Date().getTime() - start;

            console.log('Response time: %sms', ms);
        });
        this.bot.catch((err: any, ctx: ContextMessageUpdate) => {
            const { reply } = ctx;

            console.error(err);

            if (err instanceof Error && err.message) {
                reply("Unhandled error: " + err.message);
            } else {
                reply("Unhandled error: " + err);
            }
        });
        this.bot.start((ctx) => ctx.reply(`欢迎使用 ${Constants.BotName} `));

        this.processControllers(controllers);

        this.bot.on("message", ctx => {
            const { message } = ctx;
            if (!message) {
                throw new Error("What happended?");
            }

            if (message.chat.type !== "private") {
                return;
            }

            ctx.reply("我是 Matataki 机器人，请问有什么可以帮忙的");
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

        for (const constructor of constructors) {
            const { prototype } = constructor;
            const prefix = Reflect.getMetadata(MetadataKeys.ControllerPrefix, constructor);
            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as CommandHandlerInfo[] ?? [];
            const events = Reflect.getMetadata(MetadataKeys.Event, constructor) as EventHandlerInfo[] ?? [];

            for (const { name, methodName, ignorePrefix } of commands) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                const commandName = prefix === "/" || ignorePrefix ? name : `${prefix}_${name}`;

                this.bot.command(commandName, this.handlerFactory(constructor.name, methodName));
            }

            for (const { name, methodName } of events) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                this.bot.on(name, this.handlerFactory(constructor.name, methodName));
            }
        }
    }
    private handlerFactory(controllerName: string, methodName: string) {
        return (ctx: ContextMessageUpdate) => {
            const { message, from } = ctx;

            if (!message) {
                throw new Error("What happended?");
            }
            if (!from) {
                throw new Error("What happended?");
            }

            type ContextType = ReturnType<typeof BotServiceImpl.prototype.createContext>;
            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ContextType;

            context.container.bind<ContextType>(Injections.Context).toConstantValue(context);

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
        await this.databaseService.waitForConnectionCreated();

        await delay(2000);

        await this.bot.launch();

        this._botInfo = await this.bot.telegram.getMe();

        this._isRunning = true;

        console.log("Matataki bot is running...");
    }

    getMeInGroup(group: Group) {
        return this.bot.telegram.getChatMember(group.id, this.botInfo.id);
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
