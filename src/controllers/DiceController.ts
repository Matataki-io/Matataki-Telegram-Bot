import { BaseController } from "./BaseController";
import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { inject } from "inversify";
import { Injections } from "../constants";
import { IMatatakiService } from "../services";
import _ from 'lodash';
const Msgs = {
  helpMessage : [],
  rollMsg: (x: number) => `点数为${x}`,
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
  @Command('roll', { ignorePrefix: true })
  async roll(ctx: MessageHandlerContext) {
    await ctx.replyWithMarkdown(Msgs.rollMsg(_.random(1, 99)));
  }
  @Command('new_game_roll', { ignorePrefix: true })
  async dice(ctx: MessageHandlerContext) {
    
  }

  private parseDiceArguments(txt :string) {
    const match = txt.match(/^\/new_game_roll(?:@[\w_]+)?\s+(\d*\.?\d*)\s+(\w+)/);
  }

  private async getMatatakiUser(ctx: MessageHandlerContext): Promise<MatatakiUser> {
    let info = await asyncReplaceErr(this.matatakiService.getAssociatedInfo(tgid),
      Msgs.cantGetUserInfo);
    check(info.user, Msgs.noUserMessage);
    return info.user as unknown as Promise<{ name: string, id: number }>;
  }
}
