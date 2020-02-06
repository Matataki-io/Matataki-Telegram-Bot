import { inject } from "inversify";

import { Injections } from "#/constants";
import { Controller, Command, InjectRepository } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";
import { IMatatakiService, IWeb3Service } from "#/services";
import { filterNotNull } from "#/utils";

import { BaseController } from ".";
import { Extra, Markup } from "telegraf";

@Controller("wallet")
export class WalletController extends BaseController<WalletController> {
    constructor(
    @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
    @inject(Injections.Web3Service) private web3Service: IWeb3Service,
    @InjectRepository(User) private userRepo: IUserRepository) {
        super();
    }

  @Command("query", { ignorePrefix: true })
    async queryToken(ctx: MessageHandlerContext) {
        const { message, replyWithMarkdown } = ctx;
        const { text } = message;

        const match = /^\/query(?:@[\w_]+)?\s+(\d+|@[\w+_]{5,32})\s+(\w+)/.exec(text);
        if (match && match.length === 3) {
            const target = match[1];
            let userId: number;
            if (target[0] === "@") {
                const targetId = await this.userRepo.getIdByUsername(target.slice(1));
                const targetInfo = await this.matatakiService.getAssociatedInfo(targetId);
                if (!targetInfo.user) {
                    throw new Error("What happended?");
                }

                userId = targetInfo.user.id;
            } else {
                userId = Number(match[1]);
            }

            const symbol = match[2];

            await this.queryUserToken(ctx, userId, symbol);
            return;
        }

        if (/^\/query(?:@[\w_]+)?\s*$/) {
            await this.queryMyTokens(ctx);
            return;
        }

        await replyWithMarkdown("格式不对，暂时只接受 `/query` 和 `/query [Matataki UID] [Fan票 符号]`");
    }
  private async queryMyTokens({ message, telegram }: MessageHandlerContext) {
      const id = message.from.id;
      const info = await this.matatakiService.getAssociatedInfo(id);

      const array = new Array<string>();

      if (!info.user) {
          array.push("尚未绑定 瞬Matataki 账户");
      } else {
          array.push(`瞬Matataki 昵称：[${info.user.name}](${this.matatakiService.urlPrefix}/user/${info.user.id})`);
      }

      if (!info.minetoken) {
          array.push("您在 瞬Matataki 尚未发行 Fan票");
      } else {
          array.push(`Fan票 名称：[${info.minetoken.symbol}（${info.minetoken.name}）](${this.matatakiService.urlPrefix}/token/${info.minetoken.id})`);
      }

      if (info.user) {
          array.push("");

          const wallet = await this.matatakiService.getEthWallet(message.from.id);
          const minetokens = await this.matatakiService.getAllMinetokens();

          const balances = filterNotNull(await Promise.all(minetokens.map(async token => {
              const balance = await this.web3Service.getBalance(token.contract_address, wallet);
              if (balance <= 0) {
                  return null;
              }

              return `[${token.name}（${token.symbol}）](${this.matatakiService.urlPrefix}/token/${token.id})： ${balance}`;
          })));

          array.push(`*您当前持有 ${balances.length} 种 Fan票*`);

          for (const item of balances) {
              array.push(item);
          }
      }

      await telegram.sendMessage(message.chat.id, array.join("\n"), { parse_mode: "Markdown", disable_web_page_preview: true });
  }
  private async queryUserToken({ message, reply }: MessageHandlerContext, userId: number, symbol: string) {
      const balance = await this.matatakiService.getUserMinetoken(userId, symbol);

      await reply(`${balance} ${symbol}`);
  }

  @Command("transfer", { ignorePrefix: true })
  async transfer({ message, replyWithMarkdown, telegram }: MessageHandlerContext) {
      const sender = message.from.id;
      const info = await this.matatakiService.getAssociatedInfo(sender);
      if (!info.user) {
          await replyWithMarkdown("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
          return;
      }

      const match = /^\/transfer(?:@[\w_]+)?\s+(\d+|@[\w+_]{5,32})\s+(\w+)\s+(\d+.?\d*)/.exec(message.text);
      if (!match || match.length < 4) {
          await replyWithMarkdown("格式不对，请输入 `/transfer [matataki id] [symbol] [amount]`");
          return;
      }

      let targetName;

      const target = match[1];
      let userId: number;
      if (target[0] === "@") {
          const targetId = await this.userRepo.getIdByUsername(target.slice(1));

          const targetInfo = await this.matatakiService.getAssociatedInfo(targetId);
          if (!targetInfo.user) {
              await replyWithMarkdown("抱歉，目标帐号没有在 瞬Matataki 绑定 Telegram 帐号");
              return;
          }

          userId = targetInfo.user.id;
          targetName = targetInfo.user.name;
      } else {
          userId = Number(match[1]);

          const targetInfo = await this.matatakiService.getInfoByMatatakiId(userId);

          targetName = targetInfo.nickname ?? targetInfo.username;
      }

      const symbol = match[2];
      const amount = Number(match[3]) * 10000;

      let commonMessage = `

转账方：[${info.user.name}](${this.matatakiService.urlPrefix}/user/${info.user.id})
被转账方：[${targetName}](${this.matatakiService.urlPrefix}/user/${userId})
转账数目：${amount / 10000} ${symbol}`;
      const transactionMessage = await replyWithMarkdown("转账交易进行中..." + commonMessage, { disable_web_page_preview: true });

      let finalMessage;
      try {
          let tx_hash = await this.matatakiService.transfer(info.user.id, userId, symbol, amount);


          commonMessage += `\n[转账成功](https://rinkeby.etherscan.io/tx/${tx_hash})`;

          finalMessage = "*转账成功*" + commonMessage;

      } catch {
          finalMessage = "转账失败" + commonMessage;
      }

      await telegram.editMessageText(message.chat.id, transactionMessage.message_id, undefined, finalMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }
}
