import { BaseController } from "./BaseController";
import { Controller, Command, Action } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { inject } from "inversify";
import { Injections } from "../constants";
import { IMatatakiService } from "../services";
import { MatatakiUser, Arguments, IRPSService } from "#/services/IRPSService";
import _ from 'lodash';
import { asyncReplaceErr, checkNotNull, checkWith } from "../utils";
const Msgs = {
    helpMessage: [
        "开始一局游戏:/new_rps_game",
        "注意:只有发送者能够开局或者流局"].join("\n"),
    rollMessage: (x: number) => `点数为${x}`,
    errorMessage: "错误的指令格式。",
    noUserMessage: "尚未绑定 瞬Matataki 账户",
    cantGetUserInfo: "Matataki用户信息获取失败",
}

@Controller('RPS')
export class RPSController extends BaseController<RPSController>{
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.RPSService) private rpsService: IRPSService) {
        super();
    }
    @Command('new_rps_game', { ignorePrefix: true })
    async RPS(ctx: MessageHandlerContext) {
        try {
            console.log('new game..');
            const sender = await this.getMatatakiUser(ctx);
            const _id = this.rpsService.registerGame(sender,
                {
                    chatId: ctx.message.chat.id,
                    messageId: 0
                });
            await this.rpsService.resendGame(ctx, _id);
            console.log('created game..')
        } catch (err) {
            await ctx.reply([err.message, Msgs.helpMessage]
                .join('\n'));
        }
    }
    @Action(/rps_resend \w+/)
    async resend(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id)=>
            await this.rpsService.resendGame(ctx, _id));
    }
    @Action(/rps_join \w+/)
    async join(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const joiner = await this.getMatatakiUser(ctx);
            console.log("joined");
            await this.rpsService.joinGame(ctx, joiner, _id);
        });
    }
    @Action(/rps_start \w+/)
    async start(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const user = await this.getMatatakiUser(ctx);
            await this.rpsService.startGame(ctx, _id, user.id);});
    }
    @Action(/rps_show \w+/)
    async show(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const user = await this.getMatatakiUser(ctx);
            await this.rpsService.showHand(ctx, _id, user.id);
        });
    }
    @Action(/rps_close \w+/)
    async close(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const user = await this.getMatatakiUser(ctx);
            await this.rpsService.closeGame(ctx, _id, user.id);
        });
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
    }
    private parseCbArg(text: string): number {
        let match = text.match(/[\w_]+\s(.+)/);
        match = checkNotNull(match, "redEnvelope : callback arg parse fail");
        return Number(match[1]);
    }

    private async doAction(ctx: MessageHandlerContext,
        f: (x: number) => Promise<void>) {
        const cb = ctx.callbackQuery;
        if (cb?.data) {
            try {
                const id = this.parseCbArg(cb.data);
                await f(id);
            } catch (err) {
                await ctx.reply([err.message, Msgs.helpMessage]
                    .join('\n'));
            }
        }
    }
}
