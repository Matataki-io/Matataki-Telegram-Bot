import { inject, Container } from "inversify";
import Telegraf, { ContextMessageUpdate, Middleware, session } from "telegraf";
import { User } from "telegraf/typings/telegram-types";
import { getRepository } from "typeorm";

import { Constants, MetadataKeys, Injections, LogCategories } from "#/constants";
import { ControllerConstructor } from "#/controllers";
import { controllers } from "#/controllers/export";
import { CommandHandlerInfo, EventHandlerInfo, MessageHandler, MessageHandlerContext } from "#/definitions";
import { Service } from "#/decorators";
import { Group, Metadata } from "#/entities";
import { IBotService, IDatabaseService, ILoggerService } from "#/services";
import { delay } from "#/utils";
import { GroupController } from "#/controllers/GroupController";

@Service(Injections.BotService)
export class BotServiceImpl implements IBotService {
    private bot: Telegraf<ContextMessageUpdate>;

    private botInfo?: User;
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

    constructor(@inject(Injections.DatabaseService) private databaseService: IDatabaseService,
        @inject(Injections.LoggerService) private logger: ILoggerService,
        @inject(Injections.Container) private container: Container) {
        console.assert(process.env.BOT_TOKEN);

        this.bot = new Telegraf<ContextMessageUpdate>(process.env.BOT_TOKEN!)

        this.bot.use(session());

        this.bot.use((ctx, next) => {
            const context = this.createContext(ctx);
            Reflect.defineMetadata(MetadataKeys.Context, context, ctx);

            this.logger.trace(LogCategories.TelegramUpdate, JSON.stringify(ctx.update));
            console.log("Update", ctx.update);

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

            this.logger.error(LogCategories.TelegramUpdate, err);

            if (err instanceof Error && err.message) {
                reply("Unhandled error: " + err.message);
            } else {
                reply("Unhandled error: " + err);
            }
        });
        this.bot.start(async ctx => {
            const { startPayload } = ctx as any;

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

            ctx.telegram.sendMessage(ctx.chat!.id, `感谢您使用 Matataki 粉丝群助手，输入 /help 查看更多功能列表
👉🏻[介绍文档](https://www.matataki.io/p/1638)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
        });
        this.bot.help(ctx => {
            const username = this.botInfo!.username!;
            const escapedUsername = username.replace("_", "\\_");
            const urlPrefix = process.env.MATATAKI_URLPREFIX!;

            ctx.telegram.sendMessage(ctx.chat!.id, `您在与 Matataki 粉丝群助手对话时可以使用以下指令
您也可以点击输入框边的"/"按钮查看全部指令

/help： 查看帮助
/start： 开始建立 Fan票 粉丝群
/status： 查询您的所有状态信息（创建的 Fan票、创建的群组、已加入的群组）
/join：查询您还未加入的Fan票群信息
/mygroups： 查询您建立的Fan票粉丝群组信息（群 ID、群名称、Fan 票名、群规则）
/set： 设置群规则，输入 \`/set [群组ID] [参数]\` 即可设置群规则（参数代表至少持有您的 Fan票 数量），例如 \`/set 1234565 100\` 就是设置 123456 这个群的入群条件为 ≥100
/rule：查询当前群组的群规则

================

👉*我应该如何建立 Fan票 群？*
❗此功能仅向已经发行过 Fan票 的用户开放，其他用户暂不支持建立 Fan票 群
❗如果希望发行 Fan票，请先填写并提交[表单](https://wj.qq.com/s2/5208015/8e5d/)

操作步骤：
1️⃣ 在 瞬Matataki 上登录后[绑定 Telegram 账号](${urlPrefix}/setting/account)
2️⃣ 在 TG 中搜索 @${escapedUsername} 并添加为好友，或点击此[链接](https://t.me/${escapedUsername}?start)
3️⃣ 在 TG 中新建一个 Group，并将 @${escapedUsername} 邀请入群
4️⃣ 在群组中将 @${escapedUsername} 设置为群管理员
5️⃣ 设置 @${escapedUsername} 的管理员权限：先关闭邀请权限并保存，然后再打开邀请权限（操作此步骤之后群组将会自动升级为超级群）
6️⃣ 与 @${escapedUsername} 私聊，输入 \`/mygroups\` 查询自己创建的群组并记录下刚才群组的 ID 信息
7️⃣ 与 @${escapedUsername} 私聊，输入 \`/set [群组ID] [参数]\` 即可设置群规则（参数代表至少持有您的 Fan票 数量），例如 \`/set 1234565 100\` 就是设置 123456 这个群的入群条件为 ≥100

👨‍👩‍👦‍👦完成以上 7 步操作即可完成 Fan票 群建立
已经建立过的 Fan票 群组将会显示在 Fan票 详情页中
如有其他问题请在 瞬Matataki 的[官方 TG 群](https://t.me/smartsignature_io)询问`, { parse_mode: 'Markdown', disable_web_page_preview: true });
        });

        this.processControllers(controllers);

        this.bot.on("message", ctx => {
            const { message } = ctx;
            if (!message) {
                throw new Error("What happended?");
            }

            if (message.chat.type !== "private") {
                return;
            }

            ctx.reply("我是 Matataki 机器人，输入 /help 可获得帮助信息");
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

        await this.checkBotOwner();

        await delay(2000);

        await this.bot.launch();

        this._isRunning = true;

        console.log("Matataki bot is running...");
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
            return;
        }

        console.error("你的机器人信息对不上当前的数据库 schema，请把 ormconfig.js 的 schema 改成别的然后做 migrations 再运行机器人");

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
