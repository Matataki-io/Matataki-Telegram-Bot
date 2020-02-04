import { BaseController } from '.';
import { Controller, Command } from '#/decorators';
import { MessageHandlerContext } from '#/definitions';
import { inject } from 'inversify';
import { Injections } from '#/constants';
import { IMatatakiService, IRedEnvelopeService } from '#/services';

const Msgs = {
  helpMessage: [
    "发红包:/fahongbao <Fan票符号> <总红包金额> <红包数量> [<描述>]",
    "发随机红包:/sfahongbao <Fan票符号> <总红包金额> <红包数量> [<描述>]",
    "收红包:/hongbao"].join("\n"),
  errorMessage: "错误的指令格式。",
  nonPositiveQuantity: "数量不能为0或者负哦。",
  noUserMessage: "尚未绑定 瞬Matataki 账户",
  insuffMessage: "您的金额不足哦。",
  tooLessAmount: "红包金额过小哦",
  cantGetUserInfo:"Matataki用户信息获取失败",
  successMessage:
    (userName: string) => userName +
      "发了红包，快来抢吧！输入 /hongbao 抢红包",
  grabMessage:
    (x: string[]) => x.length === 0 ? "一个红包也没抢到" :
      x.join('\n')
};

interface Arguments {
  unit: string;
  amount: number;
  quantity: number;
  description: string;
};
function err(errMsg: string): never {
  throw new Error(errMsg + "\n" + Msgs.helpMessage);
}
function check(test: any, errMsg: string) {
  if (!test) { err(errMsg);}
}
function checkWith<T>(val:T,checker: (v: T) => any, errMsg: string): T {
  if (!checker(val)) { return err(errMsg); } else {
    return val;
  }
}
function replaceErr<T>(thunk:() => T, errMsg: string):T {
  try {
    return thunk();
  } catch (err) {
    return err(errMsg);
  }
}
async function asyncReplaceErr<T>(p: Promise<T>, errMsg: string): Promise<T> {
  try {
    return await p;
  } catch (err) {
    return err(errMsg);
  }
}

@Controller("RedEnvelope")
export class RedEnvelopeController extends BaseController<RedEnvelopeController>{
  constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
    @inject(Injections.RedEnvelopeService) private redEnvelopService: IRedEnvelopeService
  ) {
    super();
  }
  // /fahongbao unit amount quantity@xxxbot
  @Command('fahongbao', { ignorePrefix: true })
  async putEnvelope(ctx: MessageHandlerContext) {
    await this.doPutEnvelope(ctx, 'fahongbao', this.normalDistribute);
  }
  @Command('sfahongbao', { ignorePrefix: true })
  async randPutEnvelope(ctx: MessageHandlerContext) {
    await this.doPutEnvelope(ctx,'sfahongbao', this.randDistribute);
  }

  private async doPutEnvelope(ctx: MessageHandlerContext,
    cmd : string,
    distribution: (amount: number, quantity: number) => number[]) {
    try {
      let args: Arguments = this.parseArgument(cmd,ctx.message.text);
      let sender = await this.getMatatakiUser(ctx.message.from.id);
      sender.name = this.getTgName(ctx);
      let amountArr = distribution(args.amount, args.quantity);
      this.redEnvelopService.registerEnvelope(sender,
        args.unit.toUpperCase(), amountArr, args.quantity, args.description);
      ctx.reply(Msgs.successMessage(sender.name));
    }
    catch (e) {
      await ctx.reply(e.message);
    }
  }

  @Command('hongbao', { ignorePrefix: true })
  async getEnvelope(ctx: MessageHandlerContext) {
    try {
      let user = await this.getMatatakiUser(ctx.message.from.id);
      user.name = this.getTgName(ctx);
      let msgs = await this.redEnvelopService.grab(user);
      await ctx.reply(Msgs.grabMessage(msgs));
    } catch (e) {
      await ctx.reply(e.message);
    }
  }

  private parseArgument(cmd: string, text: string): Arguments {
    let match: any = RegExp('^/' + cmd + '(?:@[\\w_]+)?\\s+(\\w+)\\s+(\\d*\\.?\\d*)\\s+(\\d+)\\s*(\\S*)')
      .exec(text);
    check(match && match.length === 5, Msgs.errorMessage);
    let quantity: number = checkWith(parseInt(match[3]), (x) => x > 0,
      Msgs.nonPositiveQuantity);
    return {
      unit: match[1],
      amount: checkWith(Number(match[2]) * 10000,
        (x) => x === Math.floor(x) && x>= quantity,
        Msgs.tooLessAmount),
      quantity,
      description: match[4]
    };
  }
  private normalDistribute(amount: number,quantity : number) : number[]{
    let single = Math.floor(amount / quantity);
    let extra = amount - quantity * single;
    return new Array(quantity).fill(1).map((v, i) =>
      i == quantity - 1 ? single + extra : single);
  }
  private randDistribute(amount: number, quantity: number): number[] {
    // generate a number from 1 to upperBound-1
    const randIn = (upperBound: number) => Math.floor(Math.random() * (upperBound-1)) + 1;
    // generate a number from 1 to upperBound-1,but not in arr
    const tryRandIn = (upperBound: number, arr: number[]) : number => {
      let rand = randIn(upperBound);
      return arr.includes(rand) ? tryRandIn(upperBound, arr) : rand;
    }
    const points = new Array(quantity - 1).fill(1).reduce(x => [...x, tryRandIn(amount, x)]
      , []).sort((x: number, y: number) => x - y);
    return [...points, amount].reduce((x, v, i) => [...x, i == 0 ? v : v - points[i - 1]], []);
  }
  private async getMatatakiUser(tgid: number):
    Promise<{ name: string, id: number }> {
    let info = await asyncReplaceErr(this.matatakiService.getAssociatedInfo(tgid),
      Msgs.cantGetUserInfo);
    check(info.user, Msgs.noUserMessage);
    return info.user as unknown as Promise<{ name: string, id: number }>;
  }
  private getTgName(ctx: MessageHandlerContext): string {
    return ctx.message.from.first_name +
      (ctx.message.from.last_name ? ctx.message.from.last_name : '');
  };
}