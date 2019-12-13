import { ContextMessageUpdate } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";

export type MessageHandlerContext = Omit<ContextMessageUpdate, "message"> & {
    message: Omit<IncomingMessage, "text"> & { text: string };
}

export interface MessageHandler {
    (ctx: MessageHandlerContext): any
}
