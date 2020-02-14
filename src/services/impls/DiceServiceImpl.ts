import { IDiceService } from "#/services";
import {
    Arguments, MatatakiUser, MessageContext
} from "#/services/IDiceService";
import { MessageHandlerContext } from "#/definitions";
import { Markup } from "telegraf";
import _ from "lodash";
import { Service } from "../../decorators";
import { Injections } from "../../constants";
import { inject } from "inversify";
import { IMatatakiService } from "../IMatatakiService";
import { check } from "../../utils";
interface GameUser extends MatatakiUser {
    rollPoint: number,
}
type GameStatus = 'room' | 'end' | 'draw';
type Game = {
    args: Arguments,
    sender: MatatakiUser,
    msgCtx: MessageContext,
    _id: number,
    joinUsers: GameUser[],
    status: GameStatus,
};
const getWinner = (joinUsers: GameUser[]) =>
    _.maxBy(joinUsers, ({ rollPoint }) => rollPoint);
const Msgs = {
    insuffMoney: "您的账户余额不足以支付赌注",
    gameTitle: ({ args: { amount, unit }, sender: { name } }: Game) =>
        [`${name}的掷骰子游戏   赌注:${amount / 10000} ${unit}`,
            `<i>注意：只有游戏的发起者可以选择开局或者流局</i>`
        ].join('\n'),
    renderUser: ({ name, id, rollPoint }: GameUser, status: GameStatus) =>
        status === 'end' ?
            `<u>${name} ${rollPoint}</u>` :
            `<u>${name}</u>`,
    renderWinner: (winner: GameUser) =>
        `胜者是${winner.name},点数为${winner.rollPoint}`,
    renderFooter: ({ status, joinUsers}: Game) =>
        status === 'room' ?
            `${joinUsers.length}名玩家已准备,等待更多的玩家加入......` :
            status === 'draw' ?
                `流局` :
                `已结束, ${((winner) => winner ? Msgs.renderWinner(winner)
                    : `没有胜利者`)(getWinner(joinUsers)) }`
};
@Service(Injections.DiceService)
export class DiceServiceImpl implements IDiceService {
    private counter: number = 0;
    private games: Game[] = [];
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {

    }
    removeEmptyGames() {
        this.games = this.games.filter(({ status }) =>
            status === 'room');
    }
    registerGame(args: Arguments, sender: MatatakiUser, msgCtx: MessageContext): number {
        this.removeEmptyGames();
        const _id = this.counter++;
        this.games.push({
            args, sender, msgCtx, _id,
            joinUsers: [],
            status: 'room'
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
        const userTexts = game.joinUsers.map(
            _.partial(Msgs.renderUser, _, game.status)).join('\n');
        const footer = Msgs.renderFooter(game);
        const messages = [gameTitle, userTexts, footer].join('\n');
        const replyMarkup = game.status === 'room' ? Markup.inlineKeyboard([
            [Markup.callbackButton("加入", `dice_join ${game._id}`),
                Markup.callbackButton("继续发送", `dice_resend ${game._id}`),
                Markup.callbackButton("开局", `dice_roll ${game._id}`),
                Markup.callbackButton("流局", `dice_close ${game._id}`)]
        ]) : undefined;
        if (modified) {
            const { chatId, messageId } = game.msgCtx;
            await ctx.telegram.editMessageText(chatId, messageId, undefined,
                messages, {
                    disable_web_page_preview: true,
                    parse_mode: "HTML",
                    reply_markup: replyMarkup
                });
        } else {
            if (game.msgCtx.messageId != 0) {
                await ctx.telegram.deleteMessage(game.msgCtx.chatId,
                    game.msgCtx.messageId);
            }
            const { message_id } = await ctx.replyWithMarkdown(messages, {
                disable_web_page_preview: true,
                parse_mode: "HTML",
                reply_markup: replyMarkup
            });
            game.msgCtx.messageId = message_id;
        }
    }
    async joinGame(ctx: MessageHandlerContext, joiner: MatatakiUser, id: number) {
        const enoughMoney = async (user: MatatakiUser, game: Game) => {
            const money = await this.getBalance(user, game.args.unit);
            check(money >= game.args.amount, Msgs.insuffMoney);
        };
        const game = _.find(this.games, ({ _id }) => _id === id);
        if (game) {
            if (!_.find(game.joinUsers, ({ id }) => id == joiner.id))
            {
                await enoughMoney(joiner, game);
                game.joinUsers.push({ ...joiner, rollPoint: 0 });
                await this.renderGame(ctx, game);
            }
        }
    }
    async rollGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {
        const game = _.find(this.games, ({ _id }) => id === _id);
        if (game && game.status == 'room'&& game.sender.id === remote) {
            game.joinUsers.forEach(user =>
                user.rollPoint = _.random(1, 99));
            game.status = 'end';
            this.processTransfers(ctx, game);
            await this.renderGame(ctx, game);
        }
    }
    async closeGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {
        const game = _.find(this.games, ({ _id }) => id === _id);
        if (game && game.status == 'room' && game.sender.id === remote) {
            game.status = 'draw';
            await this.renderGame(ctx, game);
        }
    }
    private async processTransfers(ctx: MessageHandlerContext, game: Game) {
        const winner = getWinner(game.joinUsers);
        let messages = '结算记录:\n';
        let bonus = 0;
        if (winner) {
            for (const { name, id } of game.joinUsers) {
                try {
                    if (id != winner.id) {
                        const txHash = await this.matatakiService.transfer(
                            id, winner.id, game.args.unit, game.args.amount);
                        messages += `<a href="https://rinkeby.etherscan.io/tx/${txHash}">\
结算成功:${name} -${game.args.amount / 10000} ${game.args.unit} </a>\n`;
                        bonus += game.args.amount;
                    }
                }catch(err) {
                    messages += `结算失败\n`;
                }
            }
            messages += `${winner.name} +${bonus/10000} ${game.args.unit}`;
            await ctx.replyWithHTML(messages, { disable_web_page_preview: true });
        }
    }
    private async getBalance(user: MatatakiUser, tokenSymbol: string): Promise<number> {
        const balance = await this.matatakiService.getUserMinetoken(user.id, tokenSymbol);
        return balance * 10000;
    }

}
