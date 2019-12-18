import Telegraf, { ContextMessageUpdate, Middleware, session } from "telegraf";

import { User } from "telegraf/typings/telegram-types";

import { Constants, MetadataKeys, Injections } from "../constants";
import { ControllerConstructor, controllers } from "../controllers";
import { CommandDefinition, MessageHandler, MessageHandlerContext } from "../definitions";
import { Service } from "../decorators";
import { JoinGroupHandler } from "../handlers";

import { container } from "../container";
import { stage } from "../stages";

@Service(Injections.BotService)
export class BotService {
    private bot: Telegraf<ContextMessageUpdate>;

    private botInfo!: User;

    constructor() {
        const botToken = process.env["BOT_TOKEN"];
        if (!botToken) {
            console.error("Bot token not found");
            process.exit(1);
        }

        this.bot = new Telegraf<ContextMessageUpdate>(botToken)

        this.bot.use(session());
        this.bot.use(stage.middleware() as Middleware<ContextMessageUpdate>);

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

        this.bot.hears('hi', (ctx) => ctx.reply('我是 Matataki 机器人，请问有什么可以帮忙的'));
        this.bot.start((ctx) => ctx.reply(`欢迎使用 ${Constants.BotName} `));

        this.bot.on("new_chat_members", (ctx) => {
            const { message } = ctx;
            if (!message || !message.from) {
                throw new Error("What happened?");
            }

            const inviter = message.from.id;

            for (const member of message.new_chat_members ?? []) {
                if (member.is_bot && member.id === this.botInfo.id) {
                    if (message.chat.type === "group") {
                        const handler = container.get<JoinGroupHandler>(Injections.JoinGroupHandler);

                        handler.process(message.chat.id, inviter, ctx.telegram);
                    }
                }
            }
        });

        this.mapCommands(controllers);
    }

    private createContext(ctx: ContextMessageUpdate) {
        return {
            ctx,
            container: container.createChild(),
        };
    }

    private mapCommands(constructors: ControllerConstructor[]) {
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
            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as CommandDefinition[];

            for (const { name, methodName, ignorePrefix } of commands) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                const commandName = prefix === "/" || ignorePrefix ? name : `${prefix}_${name}`;

                this.bot.command(commandName, this.handlerFactory(constructor.name, methodName));
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
        await this.bot.launch();

        this.botInfo = await this.bot.telegram.getMe();

        console.log("Matataki bot is running...")
    }
}
