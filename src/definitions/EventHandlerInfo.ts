import { UpdateType, MessageSubTypes } from "telegraf/typings/telegram-types";

export type EventHandlerInfo = {
    name: UpdateType | UpdateType[] | MessageSubTypes | MessageSubTypes[],
    methodName: string,
}
