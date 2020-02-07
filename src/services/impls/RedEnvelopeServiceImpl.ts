import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { IRedEnvelopeService, IMatatakiService } from "#/services";
import { inject } from "inversify";

type MatatakiUser = { id: number, name: string };
type MessageContext = { messages: string, messageId: number, chatId: number};
type Envelope = {
    msgCtx: MessageContext,
    sender: MatatakiUser,
    unit: string,
    amountArr: number[],
    quantity: number,
    takenUsers: number[],
    description: string,
};

type Transfer = {
    fromName: string,
    toName: string,
    from: number,
    to: number,
    amount: number,
    unit: string,
    description: string,
    msgCtx: MessageContext
};

const Msgs = {
    grabMessage: ({ unit, fromName, toName, amount, description }: Transfer,
        txHash: string) =>
        `[${toName}抢到了${fromName}的一个${description}红包, 价值 ${amount / 10000} ${unit}]`
    + `(https://rinkeby.etherscan.io/tx/${txHash})`
};

@Service(Injections.RedEnvelopeService)
export class RedEnvelopeServiceImpl implements IRedEnvelopeService {
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
    //process.on('SIGINT', this.beforeExit.bind(this));
    }
    private envelopes: Envelope[] = new Array();
    private removeEmptyEnvelopes() {
        this.envelopes = this.envelopes.filter(({ quantity, takenUsers }) => {
            return takenUsers.length < quantity;
        });
    }
    registerEnvelope(msgCtx: MessageContext, user: MatatakiUser, unit: string, amountArr: number[],
        quantity: number, description: string) {
        this.envelopes.push({
            msgCtx,
            sender: user,
            unit,
            amountArr,
            quantity,
            takenUsers: [],
            description
        });
    }
    async grab({ id, name }: MatatakiUser): Promise<MessageContext[]> {
        let validEnvelopes = this.envelopes.filter(({ takenUsers, quantity }) => {
            return !takenUsers.includes(id) && takenUsers.length < quantity;
        });
        let transfers: Transfer[] = validEnvelopes.map(({ unit, amountArr, sender,
            description, takenUsers, msgCtx }) => {
            takenUsers.push(id);
            return {
                unit, amount: amountArr[takenUsers.length-1],
                from: sender.id, fromName: sender.name,
                to: id, toName: name,
                description, msgCtx
            };
        });
        let msgs = await this.processTransfers(transfers);
        this.removeEmptyEnvelopes();
        return msgs;
    }
    private async processTransfers(transfers: Transfer[]): Promise<MessageContext[]> {
        let mixedRes = await Promise.all(transfers.map(async (transfer: Transfer) => {
            try {
                let { amount, from, to, unit, msgCtx } = transfer;
                let txHash = await this.matatakiService.transfer(from,
                    to, unit, amount);
                msgCtx.messages += '\n' + Msgs.grabMessage(transfer, txHash);
                return msgCtx;
            } catch (e) {
                return undefined;
            }
        }));
        return mixedRes.filter(Boolean) as MessageContext[];

    }
    private beforeExit() {
    }

}
