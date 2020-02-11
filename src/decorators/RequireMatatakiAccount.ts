import { MessageHandlerContext, ParameterInfo, ControllerMethodContext } from "#/definitions";
import { MetadataKeys, Injections, ParameterTypes } from "#/constants";
import { IMatatakiService } from "#/services";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function RequireMatatakiAccount(): MethodDecorator {
    return (target: Object, methodName: string | Symbol, descriptor: PropertyDescriptor) => {
        if (methodName instanceof Symbol) {
            throw new Error("Impossible situation");
        }

        const decoratedMethod = <HandlerFunc>descriptor.value;

        const map = Reflect.getMetadata(MetadataKeys.Parameters, target.constructor) as Map<string, Map<number, ParameterInfo>>;
        const parameters = map.get(methodName);
        if (!parameters) {
            throw new Error("Missed");
        }

        let index: number = -1;
        for (const [parameterIndex, info] of parameters) {
            if (info.type !== ParameterTypes.SenderMatatakiInfo) {
                continue;
            }

            index = parameterIndex;
        }

        if (index === -1) {
            throw new Error("Missed");
        }

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
            const matatakiService = context.container.get<IMatatakiService>(Injections.MatatakiService);

            const info = await matatakiService.getAssociatedInfo(ctx.message.from.id);
            if (!info.user) {
                await ctx.replyWithMarkdown("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
                return;
            }

            args[index - 1] = info;

            return decoratedMethod.call(this, ctx, ...args);
        };
    };
}
