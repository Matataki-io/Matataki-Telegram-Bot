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
import { check } from "../../utils";

// ==============================
// RPS of Rock-paper-scissors
// by Deaso
// ==============================

interface GameUser extends MatatakiUser {
    rpsStatu: number, // 0 rock, 1 paper, 2 scissors
    isWinner: boolean,
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
    gameTitle: ({ args: { amount, unit }, sender: { name } }: Game) =>
        [`${name}的剪刀石头布游戏,`,
            `<i>注意：只有游戏的发起者可以选择开局或者流局</i>`
        ].join('\n'),
    renderUser: ({ name, id, rpsStatu }: GameUser, status: GameStatus) =>
        status === 'end' ?
            `<u>${name} ${(rpsStatu == 0 ? '石头' : (rpsStatu == 1 ? '剪刀' : '布'))}</u>` :
            `<u>${name}</u>`,
    renderFooter: ({ status, joinUsers}: Game) => {
        if(status === 'room'){
            return `${joinUsers.length}名玩家已准备,等待更多的玩家加入......`;
        }else if(status === 'draw'){
            return `流局`;
        }else{
            var winners = '已结束，胜利者是: ';
            var havewinner = false;
            getWinner(joinUsers);
            joinUsers.forEach(user => {
                if(user.isWinner == true){
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
                return '已结束，没有胜利者'
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

    resendGame(ctx: MessageHandlerContext, id: number) {

    }

    async renderGame(ctx: MessageHandlerContext, game: Game, modified = true) {

    }
    async joinGame(ctx: MessageHandlerContext, joiner: MatatakiUser, id: number) {

    }
    async rollGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {

    }
    async closeGame(ctx: MessageHandlerContext, id: number, remote: number): Promise<void> {

    }
    private async processTransfers(ctx: MessageHandlerContext, game: Game) {

    }
    private async getBalance(user: MatatakiUser, tokenSymbol: string): Promise<number> {

    }

}
