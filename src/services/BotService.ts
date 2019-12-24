import Telegraf, { ContextMessageUpdate, Middleware, session } from "telegraf";

import { User } from "telegraf/typings/telegram-types";

import { Constants, MetadataKeys, Injections } from "../constants";
import { ControllerConstructor, controllers } from "../controllers";
import { CommandHandlerInfo, EventHandlerInfo, MessageHandler, MessageHandlerContext } from "../definitions";
import { Service } from "../decorators";
import { GroupMemberEventHandler } from "../handlers";

import { container } from "../container";
import { inject } from "inversify";
import { DatabaseService } from "./DatabaseService";
// Load `.env` file
require('dotenv').config()

@Service(Injections.BotService)
export class BotService {
    private bot: Telegraf<ContextMessageUpdate>;

    private botInfo!: User;

    private _isRunning: boolean = false;
    public get isRunning() {
        return this._isRunning;
    }

    constructor(@inject(Injections.DatabaseService) private databaseService: DatabaseService) {
        const botToken = process.env["BOT_TOKEN"];
        if (!botToken) {
            console.error("Bot token not found");
            process.exit(1);
        }

        this.bot = new Telegraf<ContextMessageUpdate>(botToken)

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

        this.bot.on("new_chat_members", async (ctx) => {
            const { message } = ctx;
            if (!message || !message.from) {
                throw new Error("What happened?");
            }
            if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
                console.log("Not support private and channel");
                return;
            }

            const handler = container.get<GroupMemberEventHandler>(Injections.GroupMemberEventHandler);

            const group = message.chat.id;
            const inviter = message.from.id;
            let members = message.new_chat_members ?? [];

            for (const member of members) {
                if (member.is_bot && member.id === this.botInfo.id) {

                    await handler.onBotJoinGroup(group, inviter, ctx.telegram);
                    break;
                }
            }

            members = members.filter(member => !member.is_bot);
            if (members.length === 0) {
                return;
            }

            await handler.onNewMembers(group, members.map(member => member.id));
        });
        this.bot.on("left_chat_member", async (ctx) => {
            const { message } = ctx;
            if (!message || !message.from) {
                throw new Error("What happened?");
            }
            if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
                console.log("Not support private and channel");
                return;
            }

            const handler = container.get<GroupMemberEventHandler>(Injections.GroupMemberEventHandler);

            const member = message.left_chat_member;
            if (!member) {
                throw new Error("What happened?");
            }

            const group = message.chat.id;

            if (member.is_bot && member.id === this.botInfo.id) {

                await handler.onBotLeaveGroup(group);
                return;
            }

            await handler.onMemberQuit(group, member.id);
        });

        this.processControllers(controllers);

        this.bot.on("message", ctx => {
            const { message } = ctx;
            if (!message || !message.text) {
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
            container: container.createChild(),
        };
    }

    private processControllers(constructors: ControllerConstructor[]) {
        for (const constructor of constructors) {
            const { name } = constructor;

            if (container.isBoundNamed(Injections.Controller, name)) {
                console.error("Duplicated controller name:", name);
                process.exit(1);
            }

            container.bind(Injections.Controller).to(constructor).whenTargetNamed(name);
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

            if (!message || !message.text) {
                throw new Error("What happended?");
            }
            if (!from) {
                throw new Error("What happended?");
            }

            type ContextType = ReturnType<typeof BotService.prototype.createContext>;
            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ContextType;

            context.container.bind<ContextType>(Injections.Context).toConstantValue(context);

            const controller = context.container.getNamed<any>(Injections.Controller, controllerName);
            const handler = controller[methodName] as MessageHandler;

            const result = handler.call(controller, ctx as MessageHandlerContext);
            if (result instanceof Promise) {
                return result;
            }
        }
    }

    async run() {
        await this.databaseService.waitForConnectionCreated();
        await this.bot.launch();

        this.botInfo = await this.bot.telegram.getMe();

        this._isRunning = true;

        console.log("Matataki bot is running...");
    }

    getMember(groupId: number, memberId: number) {
        return this.bot.telegram.getChatMember(groupId, memberId);
    }
    kickMember(groupId: number, memberId: number) {
        return this.bot.telegram.kickChatMember(groupId, memberId);
    }
}
