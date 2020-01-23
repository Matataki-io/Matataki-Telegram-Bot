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
    from: number,
    to: number,
    amount: string,
    unit: string
};
@Service(Injections.RedEnvelopeService)
export class RedEnvelopeServiceImpl implements IRedEnvelopeService {
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
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
    async grab({ id, name }: MatatakiUser): Promise<number> {
        let validEnvelopes = this.envelopes.filter(({ takenUsers, quantity }) => {
            return !takenUsers.includes(id) && takenUsers.length < quantity;
        });
        let transfers: Transfer[] = validEnvelopes.map(({ unit, amount, sender }) => {
            return { unit, amount, from: sender.id, to: id };
        });
        let succeedNums = await this.processTransfers(transfers);
        this.removeEmptyEnvelopes();
        return succeedNums;
    }
    private async processTransfers(transfers: Transfer[]): Promise<number> {
        let succeedNums = 0;
        for (let transfer of transfers) {
            try {
                await this.matatakiService.transfer(transfer.from,
                    transfer.to, transfer.unit, parseInt(transfer.amount));
                succeedNums += 1;
            } catch (e) {
            }
        }
        return succeedNums;
    }

}