import { BaseController } from "./BaseController";
import { Controller, Command, Action } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { inject } from "inversify";
import { Injections } from "../constants";
import { IBackendApiService } from "../services";
import { MatatakiUser, Arguments, IDiceService } from "#/services/IDiceService";
import _ from 'lodash';
import { asyncReplaceErr, checkNotNull, checkWith } from "../utils";


@Controller('Dice')
export class DiceController extends BaseController<DiceController>{
    constructor(@inject(Injections.BackendApiService) private backendService: IBackendApiService,
        @inject(Injections.DiceService) private diceService: IDiceService) {
        super();
    }
    @Command('new_game', { ignorePrefix: true })
    async dice(ctx: MessageHandlerContext) {

        try {
            const args = this.parseDiceArguments(ctx, ctx.message.text);
            const sender = await this.getMatatakiUser(ctx);
            const _id = this.diceService.registerGame(args, sender,
                {
                    chatId: ctx.message.chat.id,
                    messageId: 0
                });
            await this.diceService.resendGame(ctx, _id);
        } catch (err) {
            await ctx.reply([err.message, ctx.i18n.t('dice.help')]
                .join('\n'));
        }
    }
    @Action(/dice_resend \w+/)
    async resend(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id)=>
            await this.diceService.resendGame(ctx, _id));
    }
    @Action(/dice_join \w+/)
    async join(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const joiner = await this.getMatatakiUser(ctx);
            await this.diceService.joinGame(ctx, joiner, _id);
        });
    }
    @Action(/dice_roll \w+/)
    async roll(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const user = await this.getMatatakiUser(ctx);
            await this.diceService.rollGame(ctx, _id, user.id);});
    }
    @Action(/dice_close \w+/)
    async close(ctx: MessageHandlerContext) {
        this.doAction(ctx, async (_id) => {
            const user = await this.getMatatakiUser(ctx);
            await this.diceService.closeGame(ctx, _id, user.id);
        });
    }
    private parseDiceArguments(ctx: MessageHandlerContext, txt: string): Arguments {
        let match = txt.match(/^\/new_game(?:@[\w_]+)?\s+(\d*\.?\d*)\s+(\w+)/);
        match = checkNotNull(match, ctx.i18n.t('dice.errorFormat'));
        return {
            amount: checkWith(Number(match[1]) * 10000,
                (x) => x > 0, ctx.i18n.t('dice.positiveAmount')),
            unit: match[2].toUpperCase()
        }
    }
    private async getMatatakiUser(ctx: MessageHandlerContext):
    Promise<MatatakiUser> {
        const tgid = ctx.callbackQuery ? ctx.callbackQuery.from.id :
            ctx.message.from.id;
        const info = await asyncReplaceErr(this.backendService.getUserByTelegramId(tgid),
            ctx.i18n.t('dice.cantGetUserInfo'));
        const user = checkNotNull(info, ctx.i18n.t('dice.noUser'));
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
        match = checkNotNull(match, "dice : callback arg parse fail");
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
                await ctx.reply([err.message, ctx.i18n.t('dice.help')]
                    .join('\n'));
            }
        }
    }
}
