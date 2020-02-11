import { BaseController } from "./BaseController";
import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { inject } from "inversify";
import { Injections } from "../constants";
import { IMatatakiService } from "../services";
import _ from 'lodash';
import { asyncReplaceErr,checkNotNull } from "../utils";
const Msgs = {
  helpMessage: ["/roll roll一个点数(1-99)",
  "/new_game 开始一局游戏"].join("\n"),
  rollMessage: (x: number) => `点数为${x}`,
  errorMessage: "错误的指令格式。",
  noUserMessage: "尚未绑定 瞬Matataki 账户",
  cantGetUserInfo: "Matataki用户信息获取失败",
}

type MatatakiUser = {
  name: string;
  id: number;
}
@Controller('Dice')
export class DiceController extends BaseController<DiceController>{
  constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
    super();
  }
  @Command('new_game', { ignorePrefix: true })
  async dice(ctx: MessageHandlerContext) {
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
  private parseDiceArguments(txt: string): {
    unit: string,
    amount: number
  } {
    let match = txt.match(/^\/new_game(?:@[\w_]+)?\s+(\d*\.?\d*)\s+(\w+)/);
    match = checkNotNull(match, Msgs.errorMessage);
    return {
      amount: Number(match[0]),
      unit: match[1]
    }
  }
  private async getMatatakiUser(ctx: MessageHandlerContext):
    Promise<{ name: string, id: number }> {
    const tgid = ctx.message.from.id;
    const info = await asyncReplaceErr(this.matatakiService.getAssociatedInfo(tgid),
      Msgs.cantGetUserInfo);
    const user = checkNotNull(info.user, Msgs.noUserMessage);
    return { name: this.getTgName(ctx), id: user.id };
  }
  private getTgName(ctx: MessageHandlerContext): string {
    return ctx.message.from.first_name +
      (ctx.message.from.last_name ? ctx.message.from.last_name : '');
  };
}
