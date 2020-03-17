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
            throw new Error("Cannot apply @Action decorator multiple times");
        }

        commands.push({
            name,
            methodName,
        });
    };
}
