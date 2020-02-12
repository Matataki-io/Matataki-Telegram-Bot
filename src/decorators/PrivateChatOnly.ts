import { MessageHandlerContext } from "#/definitions";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function PrivateChatOnly(): MethodDecorator {
    return (target: Object, methodName: string | Symbol, descriptor: PropertyDescriptor) => {
        const decoratedMethod = <HandlerFunc>descriptor.value;

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const { chat } = ctx.message;

            if (chat.type !== "private") {
                await ctx.reply("该命令仅限和机器人私聊里使用");
                return;
            }

            return decoratedMethod.call(this, ctx, ...args);
        };
    };
}
