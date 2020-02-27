import { MetadataKeys } from "../constants";
import { EventHandlerInfo } from "#/definitions";
import { UpdateType, MessageSubTypes } from "telegraf/typings/telegram-types";

export function Event(name: UpdateType | UpdateType[] | MessageSubTypes | MessageSubTypes[]): MethodDecorator {
    return (target: Object, methodName: string | symbol) => {
        if (typeof methodName === "symbol") {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.EventNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.EventNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.EventNames, target.constructor) as EventHandlerInfo[];
        commands.push({
            name,
            methodName,
        });
    };
}
