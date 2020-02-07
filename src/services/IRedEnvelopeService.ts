type MatatakiUser = { id: number, name: string };
type MessageContext = { messages: string, messageId: number, chatId: number};
export interface IRedEnvelopeService {
    registerEnvelope(msgCtx: MessageContext, user: MatatakiUser,
        unit: string, amountArr: number[], quantity: number,
        description: string): void;
    grab(user: MatatakiUser): Promise<MessageContext[]>;
}
