import { inject } from "inversify";

import { Injections } from "#/constants";
import { Controller, Command } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { IMatatakiService, IWeb3Service } from "#/services";
import { filterNotNull } from "#/utils";

import { BaseController } from ".";

@Controller("wallet")
export class WalletController extends BaseController<WalletController> {
    constructor(
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service) {
        super();
    }

    @Command("query", { ignorePrefix: true })
    queryToken(ctx: MessageHandlerContext) {
        const { message, replyWithMarkdown } = ctx;
        const { text } = message;

        const match = /^\/query(?:@[\w_]+)?\s+(\d+)\s+(\w+)/.exec(text);
        if (match && match.length === 3) {
            const userId = Number(match[1]);
            const symbol = match[2];

            return this.queryUserToken(ctx, userId, symbol);
        }

        if (/^\/query(?:@[\w_]+)?\s*$/) {
            return this.queryMyTokens(ctx);
        }

        return replyWithMarkdown("格式不对，暂时只接受 `/query` 和 `/query [Matataki UID] [Fan票 符号]`");
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

        await reply(balance.toString());
    }

    @Command("transfer", { ignorePrefix: true })
    async transfer({ message, replyWithMarkdown }: MessageHandlerContext) {
        const sender = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user) {
            await replyWithMarkdown("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            return;
        }

        const match = /^\/transfer(?:@[\w_]+)?\s+(\d+)\s+(\w+)\s+(\d+.?\d*)/.exec(message.text);
        if (!match || match.length < 4) {
            await replyWithMarkdown("格式不对，请输入 `/transfer [matataki id] [symbol] [amount]`");
            return;
        }

        const userId = Number(match[1]);
        const symbol = match[2];
        const amount = Number(match[3]) * 10000;

        try {
            await this.matatakiService.transfer(info.user.id, userId, symbol, amount);

            await replyWithMarkdown("转账成功");
        } catch {
            await replyWithMarkdown("转账失败");
        }
    }
}
