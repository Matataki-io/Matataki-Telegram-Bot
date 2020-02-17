import { ContextMessageUpdate } from "telegraf";
import { IncomingMessage, User } from "telegraf/typings/telegram-types";

import { I18nContext } from "./I18nContext";

export type MessageHandlerContext = Omit<ContextMessageUpdate, "message"> & {
    message: Omit<IncomingMessage, "text"> & { text: string } & Omit<IncomingMessage, "from"> & { from: User };
    i18n: I18nContext,
}

export interface MessageHandler {
    (ctx: MessageHandlerContext, ...args: any[]): any
}
