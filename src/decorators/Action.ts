import { MetadataKeys } from "../constants";
import { ActionHandlerInfo } from "#/definitions";

export function Action(name: string | RegExp): MethodDecorator {
    return (target: Object, methodName: string | symbol) => {
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
    };
}
