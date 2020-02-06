import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { IRedEnvelopeService, IMatatakiService } from "#/services";
import { inject } from "inversify";

type MatatakiUser = { id: number, name: string };
type Envelope = {
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
  description: string
};

const Msgs = {
    grabMessage: ({ unit, fromName, toName, amount, description }: Transfer,
        txHash:string) =>
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
  registerEnvelope(user: MatatakiUser, unit: string, amountArr: number[],
      quantity: number, description: string) {
      this.envelopes.push({
          sender: user,
          unit,
          amountArr,
          quantity,
          takenUsers: [],
          description
      });
  }
  async grab({ id, name }: MatatakiUser): Promise<string[]> {
      let validEnvelopes = this.envelopes.filter(({ takenUsers, quantity }) => {
          return !takenUsers.includes(id) && takenUsers.length < quantity;
      });
      let transfers: Transfer[] = validEnvelopes.map(({ unit, amountArr, sender, description, takenUsers }) => {
          takenUsers.push(id);
          return {
              unit, amount: amountArr[takenUsers.length-1],
              from: sender.id, fromName: sender.name,
              to: id, toName: name,
              description
          };
      });
      let msgs = await this.processTransfers(transfers);
      this.removeEmptyEnvelopes();
      return msgs;
  }
  private async processTransfers(transfers: Transfer[]): Promise<string[]> {
      let mixedRes = await Promise.all(transfers.map(async (transfer: Transfer) => {
          try {
              let { amount, from, to, unit } = transfer;
              let txHash = await this.matatakiService.transfer(from,
                  to, unit, amount);
              return Msgs.grabMessage(transfer,txHash);
          } catch (e) {
              return undefined
          }
      }));
      return mixedRes.filter(Boolean) as string[];
  }
  private beforeExit() {
  }

}