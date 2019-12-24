import { MetadataKeys } from "../constants";
import { EventHandlerInfo } from "../definitions";
import { UpdateType, MessageSubTypes } from "telegraf/typings/telegram-types";

export function Event(name: UpdateType | UpdateType[] | MessageSubTypes | MessageSubTypes[]): MethodDecorator {
    return (target: Object, methodName: string | Symbol) => {
        if (methodName instanceof Symbol) {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.Event, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.Event, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.Event, target.constructor) as EventHandlerInfo[];
        commands.push({
            name,
            methodName,
        });
    };
}
