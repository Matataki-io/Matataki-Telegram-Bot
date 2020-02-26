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
export interface IRPSService {
    registerGame(sender: MatatakiUser,
        msgCtx: MessageContext): number;
    resendGame(ctx: MessageHandlerContext, id: number): Promise<void>;
    joinGame(ctx: MessageHandlerContext, joiner: MatatakiUser, id: number): Promise<void>
    startGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void>
    showHand(ctx: MessageHandlerContext, id: number, remote: number): Promise<void>
    closeGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void>
};
