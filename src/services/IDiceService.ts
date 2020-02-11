import { MessageHandlerContext } from "../definitions";

export type MatatakiUser = {
    name: string,
    id: number
};
export type Arguments = {
    amount: number,
    unit: string
};
export type MessageContext = {
    chatId: number;
    messageId: number;
};
export interface IDiceService {
    registerGame(args: Arguments, sender: MatatakiUser,
        msgCtx: MessageContext): number;
    resendGame(ctx: MessageHandlerContext, id: number): Promise<void>;

};
