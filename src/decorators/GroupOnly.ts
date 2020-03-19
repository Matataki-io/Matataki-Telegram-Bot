import { MessageHandlerContext } from "#/definitions";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function GroupOnly(): MethodDecorator {
    return (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) => {
        const decoratedMethod = <HandlerFunc>descriptor.value;

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const { chat } = ctx.message;

            if (chat.type !== "group" && chat.type !== "supergroup") {
                await ctx.reply(ctx.i18n.t("error.groupChatOnly"));
                return;
            }

            return decoratedMethod.call(this, ctx, ...args);
        };

        Object.defineProperty(descriptor.value, "name", { value: methodName });
    };
}
