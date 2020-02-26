import { IRPSService } from "#/services";
import {
    Arguments, MatatakiUser, MessageContext
} from "#/services/IRPSService";
import { MessageHandlerContext } from "#/definitions";
import { Markup } from "telegraf";
import _ from "lodash";
import { Service } from "../../decorators";
import { Injections } from "../../constants";
import { inject } from "inversify";
import { IMatatakiService } from "../IMatatakiService";
import { check, checkNotNull } from "../../utils";

// -----------------------------
// RPS: Rock-paper-scissors
// by Deaso
// -----------------------------

interface GameUser extends MatatakiUser {
    rpsStatu: number, // 0 rock, 1 paper, 2 scissors
    isWinner: boolean,
}
type GameStatus = 'room' | 'ready' | 'end' | 'draw';
type Game = {
    sender: MatatakiUser,
    msgCtx: MessageContext,
    _id: number,
    joinUsers: GameUser[],
    status: GameStatus,
};
const getWinner = (joinUsers: GameUser[]) => {
    const winnum = 0;
    var haverock = false;
    var havepaper = false;
    var havescissor = false;
    joinUsers.forEach(user => {
        if(user.rpsStatu === 0){
            haverock = true;
        }else if(user.rpsStatu === 1){
            havepaper = true;
        }else if(user.rpsStatu === 2){
            havescissor = true;
        }
    });
    if(haverock && havepaper && havescissor){
        return;
    }else if((!haverock && !havepaper) || (!havescissor && !havepaper) || (!haverock && !havescissor)){
        return;
    }else if(!haverock){
        joinUsers.forEach(user => {
            if(user.rpsStatu === 2){
                user.isWinner = true;
            }
        });
    }else if(!havepaper){
        joinUsers.forEach(user => {
            if(user.rpsStatu === 0){
                user.isWinner = true;
            }
        });
    }
    else if(!havescissor){
        joinUsers.forEach(user => {
            if(user.rpsStatu === 1){
                user.isWinner = true;
            }
        });
    }
}
const Msgs = {
    gameTitle: ({ sender: { name } }: Game) =>
        [`${name}的剪刀石头布游戏,`,
            `<i>注意：只有游戏的发起者可以选择开局或者流局</i>`
        ].join('\n'),
    renderUser: ({ name, id, rpsStatu }: GameUser, status: GameStatus) =>
        status === 'end' ?
            `<u>${name} ${(rpsStatu === 0 ? '石头' : (rpsStatu === 1 ? '布' : '剪刀'))}</u>` :
            `<u>${name}</u>`,
    renderFooter: ({ status, joinUsers}: Game) => {
        if(status === 'room'){
            return `${joinUsers.length}名玩家已准备,等待更多的玩家加入......`;
        }else if(status === 'ready'){
            return `游戏已开始，选择你的手势`;
        }else if(status === 'draw'){
            return `流局`;
        }else{
            var winners = '已结束，胜利者是: ';
            var havewinner = false;
            getWinner(joinUsers);
            joinUsers.forEach(user => {
                if(user.isWinner === true){
                    if(!havewinner){
                        winners += user.name;
                        havewinner = true;
                    }else{
                        winners += ',' + user.name;
                    }
                }
            })
            if(havewinner){
                return winners;
            }else{
                return '已结束，平局'
            }
        }
    }
};
@Service(Injections.RPSService)
export class RPSServiceImpl implements IRPSService {
    private counter: number = 0;
    private games: Game[] = [];
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {

    }
    removeEmptyGames() {
        this.games = this.games.filter(({ status }) =>
            (status === 'room' || status === 'ready'));
    }
    registerGame(sender: MatatakiUser, msgCtx: MessageContext): number {
        this.removeEmptyGames();
        const _id = this.counter++;
        console.log('register');
        console.log(_id);
        this.games.push({
            sender, msgCtx, _id,
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
        var replyMarkup = undefined;
        if(game.status === 'room'){
            replyMarkup = Markup.inlineKeyboard([
                [Markup.callbackButton("加入", `rps_join ${game._id}`),
                    Markup.callbackButton("继续发送", `rps_resend ${game._id}`),
                    Markup.callbackButton("开局", `rps_start ${game._id}`),
                    Markup.callbackButton("流局", `rps_close ${game._id}`)]
            ]);
        }else if(game.status === 'ready'){
            replyMarkup = Markup.inlineKeyboard([
                [Markup.callbackButton("剪刀", `rps_show ${game._id} 2`),
                    Markup.callbackButton("石头", `rps_show ${game._id} 0`),
                    Markup.callbackButton("布", `rps_show ${game._id} 1`)]
            ]);
        }
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
        const game = _.find(this.games, ({ _id }) => _id === id);
        if (game) {
            if (!_.find(game.joinUsers, ({ id }) => id === joiner.id))
            {
                game.joinUsers.push({ ...joiner, rpsStatu: -1, isWinner: false });
                await this.renderGame(ctx, game);
            }
        }
    }
    async startGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {
        console.log(id);
        const game = _.find(this.games, ({ _id }) => id === _id);
        if (game && game.status === 'room' && game.sender.id === remote) {
            game.status = 'ready';
            await this.renderGame(ctx, game);
        }
    }
    async showHand(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {
        console.log('showed');
        console.log(id);
        let match = ctx.match.input.match(/^rps_show(?:@[\w_]+)?\s+(\d*\.?\d*)\s+(\w+)/);
        match = checkNotNull(match, '格式错误');
        if(!id) id = Number(match[1]);
        console.log('showed');
        console.log(id);
        const game = _.find(this.games, ({ _id }) => id === _id);
        console.log(match[2]);
        if(match[2]){
            console.log(game.status)
            if(game && game.status === 'ready'){
                console.log('ready');
                game.joinUsers.forEach(user => {
                    if(user.id === remote){
                        user.rpsStatu = Number(match[2]);
                    }
                });
                var ended = true;
                game.joinUsers.forEach(user => {
                    console.log(user.rpsStatu)
                    if(user.rpsStatu === -1){
                        ended = false;
                    }
                });
                if(ended){
                    game.status = 'end';
                }
                await this.renderGame(ctx, game);
            }
        }
    }
    async closeGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {
        const game = _.find(this.games, ({ _id }) => id === _id);
        if (game && game.status === 'room' && game.sender.id === remote) {
            game.status = 'draw';
            await this.renderGame(ctx, game);
        }
    }

}
