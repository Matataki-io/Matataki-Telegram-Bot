import { IDiceService } from "#/services";
import {
    Arguments, MatatakiUser, MessageContext
} from "#/services/IDiceService";
import { MessageHandlerContext } from "#/definitions";
import { Markup } from "telegraf";
import _ from "lodash";
import { Service } from "../../decorators";
import { Injections } from "../../constants";
interface GameUser extends MatatakiUser {

}
type Game = {
    args: Arguments,
    sender: MatatakiUser,
    msgCtx: MessageContext,
    _id: number,
    joinUsers: GameUser[]
};
const Msgs = {
    gameTitle: ({ args: { amount, unit }, sender: { name } }: Game) =>
        `${name}的掷骰子游戏--赌注:${amount / 10000} ${unit}`,
    renderUser: ({ name, id }: GameUser) =>
        `${name}`.replace('_', '\\_')
};
@Service(Injections.DiceService)
export class DiceServiceImpl implements IDiceService {
    private counter: number = 0;
    private games: Game[] = [];
    constructor() {

    }
    registerGame(args: Arguments, sender: MatatakiUser, msgCtx: MessageContext): number {
        const _id = this.counter++;
        this.games.push({
            args, sender, msgCtx, _id,
            joinUsers: []
        });
        return _id;
    }
    async resendGame(ctx: MessageHandlerContext, id: number) {
        const g = _.find(this.games, ({ _id }) => _id === id);
        if (g) {
            await this.renderGame(ctx, g, false);
        }
    }
    async renderGame(ctx: MessageHandlerContext, game: Game, modified = true) {
        const gameTitle = Msgs.gameTitle(game);
        const userTexts = game.joinUsers.map(Msgs.renderUser).join('\n');
        const messages = [gameTitle, userTexts].join('\n');
        const replyMarkup = Markup.inlineKeyboard([
            [Markup.callbackButton("加入", `dice_join ${game._id}`),
                Markup.callbackButton("继续发送", `dice_resend ${game._id}`)]
        ]);
        if (modified) {
            const { chatId, messageId } = game.msgCtx;
            await ctx.telegram.editMessageText(chatId, messageId, undefined,
                messages, {
                    disable_web_page_preview: true,
                    parse_mode: "Markdown",
                    reply_markup: replyMarkup
                });
        } else {
            const { message_id } = await ctx.replyWithMarkdown(messages, {
                disable_web_page_preview: true,
                parse_mode: "Markdown",
                reply_markup: replyMarkup
            });
            game.msgCtx.messageId = message_id;
        }
    }
}
