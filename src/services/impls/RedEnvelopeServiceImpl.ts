import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { IRedEnvelopeService, IMatatakiService } from "#/services";
import { inject } from "inversify";

type MatatakiUser = { id: number, name: string };
type Envelope = {
    sender: MatatakiUser,
    unit: string,
    amount: string,
    quantity: number,
    takenUsers: number[]
};

type Transfer = {
    fromName:string
    from: number,
    to: number,
    amount: string,
    unit: string
};

const Msgs = {
    grabMessage: (who: string, amount: string, unit: string) =>
        `你抢到了${who}的一个红包,价值 ${amount} ${unit}`
};

@Service(Injections.RedEnvelopeService)
export class RedEnvelopeServiceImpl implements IRedEnvelopeService {
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
        process.on('exit', this.beforeExit.bind(this));
    }
    private envelopes: Envelope[] = new Array();
    private removeEmptyEnvelopes() {
        this.envelopes = this.envelopes.filter(({ quantity, takenUsers }) => {
            return takenUsers.length < quantity;
        });
    }
    registerEnvelope(user: MatatakiUser, unit: string, amount: string, quantity: number) {
        this.envelopes.push({
            sender: user,
            unit,
            amount,
            quantity,
            takenUsers: []
        });
    }
    async grab({ id, name }: MatatakiUser): Promise<string[]> {
        let validEnvelopes = this.envelopes.filter(({ takenUsers, quantity }) => {
            return !takenUsers.includes(id) && takenUsers.length < quantity;
        });
        let transfers: Transfer[] = validEnvelopes.map(({ unit, amount, sender }) => {
            return { unit, amount, from: sender.id, to: id ,fromName:sender.name};
        });
        let msgs = await this.processTransfers(transfers);
        this.removeEmptyEnvelopes();
        return msgs;
    }
    private async processTransfers(transfers: Transfer[]): Promise<string[]> {
        let mixedRes = await Promise.all(transfers.map(async ({ from, to, unit, amount, fromName }) => {
            try {
                let amountNum = Number(amount) * 10000;
                await this.matatakiService.transfer(from,
                    to, unit, amountNum);
                return Msgs.grabMessage(fromName, amount, unit);
            } catch (e) {
                return undefined
            }
        }));
        return mixedRes.filter(Boolean) as string[];
    }
    private beforeExit(code : number) {
    }

}