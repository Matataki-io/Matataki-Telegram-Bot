import { BaseController } from '.';
import { Controller, Command, Action } from '#/decorators';
import { MessageHandlerContext } from '#/definitions';
import { inject } from 'inversify';
import { Injections } from '#/constants';
import { IMatatakiService, IRedEnvelopeService } from '#/services';
import _ from 'lodash';
import { check, checkNotNull, asyncReplaceErr, checkWith } from '#/utils';
import { Arguments, MessageContext, MatatakiUser } from '#/services/IRedEnvelopeService';
import { Markup } from 'telegraf';

const Msgs = {
    helpMessage: [
        "发红包:/fahongbao <Fan票符号> <总红包金额> <红包数量> [<描述>]",
        "发随机红包:/sfahongbao <Fan票符号> <总红包金额> <红包数量> [<描述>]"].join("\n"),
    errorMessage: "错误的指令格式。",
    nonPositiveQuantity: "数量不能为0或者负哦。",
    noUserMessage: "尚未绑定 瞬Matataki 账户",
    insuffMessage: "您的金额不足哦。",
    tooLessAmount: "红包金额过小哦",
    cantGetUserInfo: "Matataki用户信息获取失败",
    successMessage:
    (userName: string) => userName +
      "发了红包，快来抢吧!",
    grabMessage:
    (x: string[]) => x.length === 0 ? "一个红包也没抢到" :
        x.join('\n')
};

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
        await this.doPutEnvelope(ctx, 'sfahongbao', this.randDistribute);
    }
    private async doPutEnvelope(ctx: MessageHandlerContext,

        cmd: string,
        distribution: (amount: number, quantity: number) => number[]) {
        try {
            const args: Arguments = this.parseArgument(cmd, ctx.message.text);
            const sender = await this.getMatatakiUser(ctx);
            const balance = await this.getBalance(sender, args.unit);
            check(args.amount <= balance, Msgs.insuffMessage);
            const amountArr = distribution(args.amount, args.quantity);
            let _id = this.redEnvelopService.registerEnvelope({
                messageId: 0, chatId: ctx.message.chat.id
            }, sender, amountArr, args);
            await this.redEnvelopService.resendEnvelope(ctx, _id);
        }
        catch (e) {
            await ctx.reply([e.message, Msgs.helpMessage].join('\n'));
        }

    }

    @Action(/hongbao \d+/)
    async getEnvelope(ctx: MessageHandlerContext) {
        try {
            const user = await this.getMatatakiUser(ctx);
            const cb = checkNotNull(ctx.callbackQuery, "can't get callbackQuery");
            const data = checkNotNull(cb.data, "can't get data of callback Query");
            const _id = this.parseCbArg(data);
            await this.redEnvelopService.grab(user, ctx, _id);
        } catch (e) {
            await ctx.reply([e.message, Msgs.helpMessage].join('\n'));
        }
    }
    @Action(/hongbao_resend \d+/)
    async resendEv(ctx: MessageHandlerContext) {
        try {
            const user = await this.getMatatakiUser(ctx);
            const cb = checkNotNull(ctx.callbackQuery, "can't get callbackQuery");
            const data = checkNotNull(cb.data, "can't get data of callback Query");
            const _id = this.parseCbArg(data);
            await this.redEnvelopService.resendEnvelope(ctx, _id);
        } catch (e) {
            await ctx.reply([e.message, Msgs.helpMessage].join('\n'));
        }
    }

    private parseArgument(cmd: string, text: string): Arguments {
        let match = RegExp('^/' + cmd + '(?:@[\\w_]+)?\\s+(\\w+)\\s+(\\d*\\.?\\d*)\\s+(\\d+)\\s*(\\S*)')
            .exec(text);
        match = checkNotNull(match, Msgs.errorMessage);
        let quantity: number = checkWith(parseInt(match[3]), (x) => x > 0,
            Msgs.nonPositiveQuantity);
        return {
            unit: match[1].toUpperCase(),
            amount: checkWith(Number(match[2]) * 10000,
                (x) => x === Math.floor(x) && x >= quantity,
                Msgs.tooLessAmount),
            quantity,
            description: match[4]
        };
    }
    private normalDistribute(amount: number, quantity: number): number[] {
        let single = Math.floor(amount / quantity);
        let extra = amount - quantity * single;
        return new Array(quantity).fill(1).map((v, i) =>
            i == quantity - 1 ? single + extra : single);
    }
    private randDistribute(amount: number, quantity: number): number[] {
    // generate a number from 1 to upperBound-1
        const randIn = (upperBound: number) => _.random(1, upperBound - 1);
        // generate a number from 1 to upperBound-1,but not in arr
        const tryRandIn = (upperBound: number, arr: number[]): number => {
            let rand = randIn(upperBound);
            return arr.includes(rand) ? tryRandIn(upperBound, arr) : rand;
        }
        const points = new Array(quantity - 1).fill(1).reduce(x => [...x, tryRandIn(amount, x)]
            , []).sort((x: number, y: number) => x - y);
        return [...points, amount].reduce((x, v, i) => [...x, i == 0 ? v : v - points[i - 1]], []);
    }
    private async getMatatakiUser(ctx: MessageHandlerContext):
    Promise<{ name: string, id: number }> {
        const tgid = ctx.callbackQuery ? ctx.callbackQuery.from.id :
            ctx.message.from.id;
        const info = await asyncReplaceErr(this.matatakiService.getAssociatedInfo(tgid),
            Msgs.cantGetUserInfo);
        const user = checkNotNull(info.user, Msgs.noUserMessage);
        return { name: this.getTgName(ctx), id: user.id };
    }
    private getTgName(ctx: MessageHandlerContext): string {
        const from = ctx.callbackQuery ? ctx.callbackQuery.from :
            ctx.message.from;
        return from.first_name +
      (from.last_name ? from.last_name : '');
    };
    private async getBalance(user: MatatakiUser, tokenSymbol: string): Promise<number> {
        const balance = await this.matatakiService.getUserMinetoken(user.id, tokenSymbol);
        return balance * 10000;
    }
    private parseCbArg(text: string): number {
        let match = text.match(/[\w_]+\s(.+)/);
        match = checkNotNull(match, "redEnvelope : callback arg parse fail");
        return Number(match[1]);
    }
}
