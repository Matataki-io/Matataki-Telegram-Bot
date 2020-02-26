import { MetadataKeys, ParameterTypes } from "../constants";
import { ActionHandlerInfo, MessageHandlerContext, ParameterInfo, RegexMatchGroupParameterInfo } from "#/definitions";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function Action(name: string | RegExp): MethodDecorator {
    return (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) => {
        if (typeof methodName === "symbol") {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.ActionNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.ActionNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.ActionNames, target.constructor) as ActionHandlerInfo[];

        if (commands.find(info => info.methodName === methodName)) {
            throw new Error("No multiple @Action");
        }

        commands.push({
            name,
            methodName,
        });

        if (!(name instanceof RegExp)) {
            return;
        }

        const decoratedMethod = <HandlerFunc>descriptor.value;

        const map = new Map<number, RegexMatchGroupParameterInfo>();

        const methodMap = Reflect.getMetadata(MetadataKeys.Parameters, target.constructor) as Map<string, Map<number, ParameterInfo>> | undefined;
        if (methodMap) {
            const parameters = methodMap.get(methodName);
            if (parameters) {
                for (const [parameterIndex, info] of parameters) {
                    if (info.type !== ParameterTypes.RegexMatchGroup) {
                        continue;
                    }

                    map.set(parameterIndex, info);
                }
            }
        }

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            for (const [parameterIndex, { groupIndex, converter }] of map) {
                let arg = ctx.match![groupIndex];

                if (converter) {
                    arg = converter(arg);
                }

                args[parameterIndex - 1] = arg;
            }

            return decoratedMethod.call(this, ctx, ...args);
        };
    };
}
