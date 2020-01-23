import { BaseController } from '.';
import { Controller,Command } from '#/decorators';
import { MessageHandlerContext } from '#/definitions';
import { inject } from 'inversify';
import { Injections } from '#/constants';
import { IMatatakiService, IRedEnvelopeService } from '#/services';

const Msgs = {
    helpMessage: [
        "发红包:/fahongbao <Fan票符号> <单个红包金额> <红包数量>",
        "收红包:/hongbao"].join("\n"),
    errorMessage: "错误的指令格式。",
    nonPositiveQuantity: "数量不能为0或者负哦。",
    noUserMessage: "尚未绑定 瞬Matataki 账户",
    insuffMessage: "您的金额不足哦。",
    successMessage:
        (userName: string) => userName +
            "发了红包，快来抢吧！输入/hongbao抢红包",
    grabMessage:
        (n: number) => n === 0 ? "一个红包也没抢到" : `你抢到了${n}个红包`
};

interface Arguments {
    unit: string;
    amount: string;
    quantity: number;
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
        try {
            let args: Arguments = this.parseArgument(ctx.message.text);
            let sender = await this.getMatatakiUser(ctx.message.from.id);
            this.redEnvelopService.registerEnvelope(sender,
                args.unit, args.amount, args.quantity);
            ctx.reply(Msgs.successMessage(sender.name));
        }
        catch (e) {
            await ctx.reply(e.message);
        }
    }
    @Command('hongbao', { ignorePrefix: true })
    async getEnvelope(ctx: MessageHandlerContext) {
        let user = await this.getMatatakiUser(ctx.message.from.id);
        let succeedNums = await this.redEnvelopService.grab(user);
        await ctx.reply(Msgs.grabMessage(succeedNums));
    }
    private err(errMsg: string) {
        return new Error(errMsg + "\n" + Msgs.helpMessage);
    }
    private checkPositiveQuantity(q: number): number {
        if (q <= 0) {
            throw this.err(Msgs.nonPositiveQuantity);
        }
        return q;
    }
    private parseArgument(text: string): Arguments {
        const match = /^\/fahongbao(?:@[\w_]+)?\s+(\w+)\s+(\d+)\s+(\d+)/.exec(text);
        if (match && match.length === 4) {
            return {
                unit: match[1],
                amount: match[2],
                quantity: this.checkPositiveQuantity(parseInt(match[3]))
            };
        } else {
            throw this.err(Msgs.errorMessage);
        }
    }
    private async getMatatakiUser(tgid: number):
                                Promise<{ name: string, id: number }> {
        let info = await this.matatakiService.getAssociatedInfo(tgid);
        if (!info.user) {
            throw this.err(Msgs.noUserMessage);
        } else {
            return info.user;
        }
    }
}