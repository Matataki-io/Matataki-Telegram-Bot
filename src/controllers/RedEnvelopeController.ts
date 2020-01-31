import { BaseController } from '.';
import { Controller,Command } from '#/decorators';
import { MessageHandlerContext } from '#/definitions';
import { inject } from 'inversify';
import { Injections } from '#/constants';
import { IMatatakiService, IRedEnvelopeService } from '#/services';

const Msgs = {
    helpMessage: [
        "发红包:/fahongbao <Fan票符号> <单个红包金额> <红包数量> [<描述>]",
        "收红包:/hongbao"].join("\n"),
    errorMessage: "错误的指令格式。",
    nonPositiveQuantity: "数量不能为0或者负哦。",
    noUserMessage: "尚未绑定 瞬Matataki 账户",
    insuffMessage: "您的金额不足哦。",
    successMessage:
        (userName: string) => userName +
            "发了红包，快来抢吧！输入/hongbao抢红包",
    grabMessage:
        (x: string[]) => x.length === 0 ? "一个红包也没抢到" :
            x.join('\n')
};

interface Arguments {
    unit: string;
    amount: string;
    quantity: number;
    description: string;
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
            sender.name = this.getTgName(ctx);
            this.redEnvelopService.registerEnvelope(sender,
                args.unit.toUpperCase(), args.amount, args.quantity, args.description);
            ctx.reply(Msgs.successMessage(sender.name));
        }
        catch (e) {
            await ctx.reply(e.message);
        }
    }
    @Command('hongbao', { ignorePrefix: true })
    async getEnvelope(ctx: MessageHandlerContext) {
        let user = await this.getMatatakiUser(ctx.message.from.id);
        user.name = this.getTgName(ctx);
        let msgs = await this.redEnvelopService.grab(user);
        await ctx.reply(Msgs.grabMessage(msgs));
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
        let match = /^\/fahongbao(?:@[\w_]+)?\s+(\w+)\s+(\d*\.?\d*)\s+(\d+)\s*(\S*)/.exec(text);
        if (match && match.length === 5) {
            return {
                unit: match[1],
                amount: match[2],
                quantity: this.checkPositiveQuantity(parseInt(match[3])),
                description:match[4]
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
    private getTgName(ctx: MessageHandlerContext): string {
        return ctx.message.from.first_name +
            (ctx.message.from.last_name ? ctx.message.from.last_name : '');
    };
}