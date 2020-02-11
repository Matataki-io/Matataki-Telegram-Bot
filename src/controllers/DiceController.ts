import { BaseController } from "./BaseController";
import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { inject } from "inversify";
import { Injections } from "../constants";
import { IMatatakiService } from "../services";
import { MatatakiUser, Arguments, IDiceService } from "#/services/IDiceService";
import _ from 'lodash';
import { asyncReplaceErr, checkNotNull, checkWith } from "../utils";
const Msgs = {
    helpMessage: ["roll一个点数(1-99):/roll",
        "开始一局游戏:/new_game <赌注> <赌注单位>"].join("\n"),
    rollMessage: (x: number) => `点数为${x}`,
    errorMessage: "错误的指令格式。",
    noUserMessage: "尚未绑定 瞬Matataki 账户",
    cantGetUserInfo: "Matataki用户信息获取失败",
    postiveAmount: "金额必须为正数"
}

@Controller('Dice')
export class DiceController extends BaseController<DiceController>{
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.DiceService) private diceService: IDiceService) {
        super();
    }
    @Command('new_game', { ignorePrefix: true })
    async dice(ctx: MessageHandlerContext) {
        const args = this.parseDiceArguments(ctx.message.text);
        const sender = await this.getMatatakiUser(ctx);
        const _id = this.diceService.registerGame(args, sender,
            {chatId: ctx.message.chat.id,
                messageId: 0
            });
        await this.diceService.resendGame(ctx, _id);
    }  
    @Command('join', { ignorePrefix: true })
    async join(ctx: MessageHandlerContext) {
    }
    @Command('roll', { ignorePrefix: true })
    async roll(ctx: MessageHandlerContext) {
        await ctx.replyWithMarkdown(Msgs.rollMessage(_.random(1, 99)));
    }
    @Command('close', { ignorePrefix: true })
    async close(ctx: MessageHandlerContext) {
    }  
    private parseDiceArguments(txt: string): Arguments {
        let match = txt.match(/^\/new_game(?:@[\w_]+)?\s+(\d*\.?\d*)\s+(\w+)/);
        match = checkNotNull(match, Msgs.errorMessage);
        return {
            amount: checkWith(Number(match[1]) * 10000,
                (x) => x > 0, Msgs.postiveAmount),
            unit: match[2].toUpperCase()
        }
    }
    private async getMatatakiUser(ctx: MessageHandlerContext):
    Promise<MatatakiUser> {
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
}
