import { injectable, multiInject } from "inversify";
import Telegraf, { ContextMessageUpdate } from "telegraf";

import { Injections, Constants, MetadataKeys } from "../constants";
import { IGenericController } from "../controllers";
import { CommandDefinition, MessageHandler, MessageHandlerContext } from "../definitions";

@injectable()
export class BotService {
    private bot: Telegraf<ContextMessageUpdate>;

    constructor(@multiInject(Injections.Controller) controllers: IGenericController[]) {
        const botToken = process.env["BOT_TOKEN"];
        if (!botToken) {
            console.error("Bot token not found");
            process.exit(1);
        }

        this.bot = new Telegraf<ContextMessageUpdate>(botToken)

        this.bot.use(async (ctx, next) => {
            const { reply } = ctx;

            try {
                const start = new Date().getTime();
                if (next) await next()
                const ms = new Date().getTime() - start;

                console.log('Response time: %sms', ms);
            } catch (e) {
                console.error(e);

                if (e instanceof Error && e.message) {
                    reply("Unhandled error: " + e.message);
                } else {
                    reply("Unhandled error: " + e);
                }
            }
        });
        this.bot.start((ctx) => ctx.reply(`欢迎使用 ${Constants.BotName} `));
        this.bot.hears('hi', (ctx) => ctx.reply('我是 Matataki 机器人，请问有什么可以帮忙的'));

        this.mapCommands(controllers);
    }

    private mapCommands(controllers: IGenericController[]) {
        for (const controller of controllers) {
            const prototype = Object.getPrototypeOf(controller);
            const constructor = prototype.constructor;
            const prefix = Reflect.getMetadata(MetadataKeys.ControllerPrefix, constructor);
            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as CommandDefinition[];

            for (const { name, methodName, ignorePrefix } of commands) {
                const member: MessageHandler = prototype[methodName];
                console.assert(member instanceof Function, `${constructor.name}.${methodName} must be a function of type Middleware<ContextMessageUpdate>`);

                const commandName = prefix === "/" || ignorePrefix ? name : `${prefix}_${name}`;

                this.bot.command(commandName, async function (ctx) {
                    const { message } = ctx;

                    if (!message || !message.text) {
                        throw new Error("What happended?");
                    }

                    member.call(controller, ctx as MessageHandlerContext);
                });
            }
        }
    }

    run() {
        this.bot.launch();

        console.log("Matataki bot is running...")
    }
}
