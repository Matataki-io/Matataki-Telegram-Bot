import { ContextMessageUpdate } from "telegraf";
import { IncomingMessage, User } from "telegraf/typings/telegram-types";

export type MessageHandlerContext = Omit<ContextMessageUpdate, "message"> & {
    message: Omit<IncomingMessage, "text"> & { text: string } & Omit<IncomingMessage, "from"> & { from: User };
}

export interface MessageHandler {
    (ctx: MessageHandlerContext): any
}
