import { MessageHandlerContext } from "../definitions";

export type MatatakiUser = { id: number, name: string };
export type MessageContext = { messageId: number, chatId: number };
export type Arguments = {
  unit: string;
  amount: number;
  quantity: number;
  description: string;
};
export interface IRedEnvelopeService {
  registerEnvelope(msgCtx: MessageContext, sender: MatatakiUser,
    amountArr: number[], args: Arguments): number;
  grab(user: MatatakiUser, ctx: MessageHandlerContext, eid: number): Promise<void>;
  resendEnvelope(ctx: MessageHandlerContext, eid: number): Promise<void>;
}
