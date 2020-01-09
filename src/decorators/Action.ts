import { MetadataKeys } from "../constants";
import { ActionHandlerInfo } from "#/definitions";

export function Action(name: string): MethodDecorator {
    return (target: Object, methodName: string | Symbol) => {
        if (methodName instanceof Symbol) {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.ActionNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.ActionNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.ActionNames, target.constructor) as ActionHandlerInfo[];
        commands.push({
            name,
            methodName,
        });
    };
}
