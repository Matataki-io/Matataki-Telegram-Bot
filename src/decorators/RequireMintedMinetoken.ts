import { MessageHandlerContext, ParameterInfo, ControllerMethodContext } from "#/definitions";
import { MetadataKeys, Injections, ParameterTypes } from "#/constants";
import { IMatatakiService } from "#/services";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function RequireMintedMinetoken(): MethodDecorator {
    return (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) => {
        if (typeof methodName === "symbol") {
            throw new Error("Impossible situation");
        }

        const decoratedMethod = <HandlerFunc>descriptor.value;

        let index: number = -1;

        const map = Reflect.getMetadata(MetadataKeys.Parameters, target.constructor) as Map<string, Map<number, ParameterInfo>> | undefined;
        if (map) {
            const parameters = map.get(methodName);
            if (parameters) {
                for (const [parameterIndex, info] of parameters) {
                    if (info.type !== ParameterTypes.SenderMatatakiInfo) {
                        continue;
                    }

                    index = parameterIndex;
                }
            }
        }

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
            const matatakiService = context.container.get<IMatatakiService>(Injections.MatatakiService);

            const info = await matatakiService.getAssociatedInfo(ctx.message.from.id);
            if (!info.user || !info.minetoken) {
                await ctx.reply(ctx.i18n.t("error.requireMintedMinetoken"));
                return;
            }

            if (index !== -1) {
                args[index - 1] = info;
            }

            return decoratedMethod.call(this, ctx, ...args);
        };

        Object.defineProperty(descriptor.value, "name", { value: methodName });
    };
}
