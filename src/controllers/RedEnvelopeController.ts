import { BaseController } from '.';
import { Controller, Command, Action } from '#/decorators';
import { MessageHandlerContext } from '#/definitions';
import { inject } from 'inversify';
import { Injections } from '#/constants';
import { IRedEnvelopeService, IBackendApiService, IWeb3Service } from '#/services';
import _ from 'lodash';
import { check, checkNotNull, asyncReplaceErr, checkWith } from '#/utils';
import { Arguments, MessageContext, MatatakiUser } from '#/services/IRedEnvelopeService';
import { Markup } from 'telegraf';


@Controller("RedEnvelope")
export class RedEnvelopeController extends BaseController<RedEnvelopeController>{
    constructor(@inject(Injections.BackendApiService) private backendService: IBackendApiService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
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
            const args: Arguments = this.parseArgument(ctx, cmd, ctx.message.text);
            const sender = await this.getMatatakiUser(ctx);
            const balance = await this.getBalance(sender, args.unit);
            check(args.amount <= balance, ctx.i18n.t('redEnvelope.insuffMoney'));
            const amountArr = distribution(args.amount, args.quantity);
            let _id = this.redEnvelopService.registerEnvelope({
                messageId: 0, chatId: ctx.message.chat.id
            }, sender, amountArr, args);
            await this.redEnvelopService.resendEnvelope(ctx, _id);
        }
        catch (e) {
            await ctx.reply([e.message, ctx.i18n.t('redEnvelope.help')].join('\n'));
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
            let array = [e.message, ctx.i18n.t('redEnvelope.help')];
            if (e.message === ctx.i18n.t('redEnvelope.noUser')) {
                array = [e.message, ctx.i18n.t('redEnvelope.instruction')];
            }

            await ctx.reply(array.join('\n'));
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
            let array = [e.message, ctx.i18n.t('redEnvelope.help')];
            if (e.message === ctx.i18n.t('redEnvelope.noUser')) {
                array = [e.message, ctx.i18n.t('redEnvelope.instruction')];
            }

            await ctx.reply(array.join('\n'));
        }
    }

    private parseArgument(ctx: MessageHandlerContext, cmd: string, text: string): Arguments {
        let match = RegExp('^/' + cmd + '(?:@[\\w_]+)?\\s+(\\w+)\\s+(\\d*\\.?\\d*)\\s+(\\d+)\\s*(\\S*)')
            .exec(text);
        match = checkNotNull(match, ctx.i18n.t('redEnvelope.errorFormat'));
        let quantity: number = checkWith(parseInt(match[3]), (x) => x > 0,
            ctx.i18n.t('redEnvelope.nonPositiveQuantity'));
        return {
            unit: match[1].toUpperCase(),
            amount: checkWith(Number(match[2]) * 10000,
                (x) => x === Math.floor(x) && x >= quantity,
                ctx.i18n.t('redEnvelope.tooLessAmount')),
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
        const info = await asyncReplaceErr(this.backendService.getUserByTelegramId(tgid),
            ctx.i18n.t('redEnvelope.cantGetUserInfo'));
        const user = checkNotNull(info, ctx.i18n.t('redEnvelope.noUser'));
        return { name: this.getTgName(ctx), id: user.id };
    }
    private getTgName(ctx: MessageHandlerContext): string {
        const from = ctx.callbackQuery ? ctx.callbackQuery.from :
            ctx.message.from;
        return from.first_name +
      (from.last_name ? from.last_name : '');
    };
    private async getBalance(user: MatatakiUser, tokenSymbol: string): Promise<number> {
        const { walletAddress } = await this.backendService.getUser(user.id);
        const { contractAddress } = await this.backendService.getToken(tokenSymbol);
        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);
        return balance * 10000;
    }
    private parseCbArg(text: string): number {
        let match = text.match(/[\w_]+\s(.+)/);
        match = checkNotNull(match, "redEnvelope : callback arg parse fail");
        return Number(match[1]);
    }
}
