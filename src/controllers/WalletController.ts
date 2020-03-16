import { inject } from "inversify";

import { Injections } from "#/constants";
import { Controller, Command, InjectRepository, InjectSenderMatatakiInfo, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { MessageHandlerContext, AssociatedInfo } from "#/definitions";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";
import { IMatatakiService, IWeb3Service } from "#/services";
import { filterNotNull } from "#/utils";

import { BaseController } from ".";
import { Extra, Markup } from "telegraf";
import { RequireMatatakiAccount } from "#/decorators/RequireMatatakiAccount";

@Controller("wallet")
@GlobalAlias("query", "query")
export class WalletController extends BaseController<WalletController> {
    constructor(
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @InjectRepository(User) private userRepo: IUserRepository) {
        super();
    }

    @Command("query", /(\d+)\s+(\w+)/)
    async queryMatatakiAccountTokenById({ reply, message }: MessageHandlerContext,
        @InjectRegexMatchGroup(1, Number) matatakiId: number,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string) {
        const balance = await this.matatakiService.getUserMinetoken(matatakiId, symbol);

        await reply(`${balance} ${symbol}`, {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query", /@([\w_]{5,32})\s+(\w+)/)
    async queryMatatakiAccountTokenByUsername({ reply, message }: MessageHandlerContext,
        @InjectRegexMatchGroup(1) username: string,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string) {
        const targetId = await this.userRepo.getIdByUsername(username);
        if (!targetId) {
            await reply("抱歉，对方还没有同步用户名到数据库里", {
                reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
            });
            return;
        }

        const minetokenId = await this.matatakiService.getMinetokenIdFromSymbol(symbol);
        const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(minetokenId);
        const walletAddress = await this.matatakiService.getEthWallet(targetId);
        console.log(contractAddress, walletAddress)
        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

        await reply(`${balance} ${symbol}`, {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query", /$/)
    @RequireMatatakiAccount()
    async queryMyTokens({ message, replyWithMarkdown }: MessageHandlerContext, @InjectSenderMatatakiInfo() info: AssociatedInfo) {
        const array = new Array<string>();

        if (!info.user) {
            array.push("尚未绑定 瞬Matataki 账户");
        } else {
            array.push(`瞬Matataki 昵称：[${info.user.name}](${this.matatakiService.urlPrefix}user/${info.user.id})`);
        }

        if (!info.minetoken) {
            array.push("您在 瞬Matataki 尚未发行 Fan票");
        } else {
            array.push(`Fan票 名称：[${info.minetoken.symbol}（${info.minetoken.name}）](${this.matatakiService.urlPrefix}token/${info.minetoken.id})`);
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

                return `[${token.name}（${token.symbol}）](${this.matatakiService.urlPrefix}token/${token.id})： ${balance}`;
            })));

            array.push(`*您当前持有 ${balances.length} 种 Fan票*`);

            for (const item of balances) {
                array.push(item);
            }
        }

        await replyWithMarkdown(array.join("\n"), {
            disable_web_page_preview: true,
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query")
    async queryToken({ message, replyWithMarkdown }: MessageHandlerContext) {
        await replyWithMarkdown("格式不对，暂时只接受 `/query` 和 `/query [Matataki UID/@Telegram 用户名] [Fan票 符号]`", {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("transfer", { ignorePrefix: true })
    @RequireMatatakiAccount()
    async transfer({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<Omit<AssociatedInfo, "minetoken">>) {
        const match = /^\/transfer(?:@[\w_]+)?\s+(\d+|@[\w_]{5,32})\s+(\w+)\s+(\d+.?\d*)/.exec(message.text);
        if (!match || match.length < 4) {
            await replyWithMarkdown("格式不对，请输入 `/transfer [Matataki UID/@Telegram 用户名] [symbol] [amount]`");
            return;
        }

        let targetName;

        const target = match[1];
        let userId: number;
        if (target.startsWith("@")) {
            const targetId = await this.userRepo.getIdByUsername(target.slice(1));
            if (!targetId) {
                await replyWithMarkdown(i18n.t("error.usernameNotSynced"));
                return;
            }

            const targetInfo = await this.matatakiService.getAssociatedInfo(targetId);
            if (!targetInfo.user) {
                await replyWithMarkdown(i18n.t("error.matatakiAccountAbsent"));
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
        const amount = Number(match[3]);

        let commonMessage = i18n.t("transfer.common", {
            senderUsername: senderInfo.user.name,
            senderUrl: `${this.matatakiService.urlPrefix}user/${senderInfo.user.id}`,
            receiverUsername: targetName,
            receiverUrl: `${this.matatakiService.urlPrefix}user/${userId}`,
            amount, symbol,
        });
        const transactionMessage = await replyWithMarkdown(`${i18n.t("transfer.started")}\n\n${commonMessage}`, { disable_web_page_preview: true });

        let finalMessage, replyMarkup;
        try {
            const tx_hash = await this.matatakiService.transfer(senderInfo.user.id, userId, symbol, amount);

            finalMessage = `${i18n.t("transfer.successful")}\n\n${commonMessage}`;

            replyMarkup = Markup.inlineKeyboard([
                [Markup.urlButton(i18n.t("transfer.transactionDetail"), `https://rinkeby.etherscan.io/tx/${tx_hash}`)]
            ]);
        } catch {
            finalMessage = `${i18n.t("transfer.failed")}\n\n${commonMessage}`;
        }

        await telegram.editMessageText(message.chat.id, transactionMessage.message_id, undefined, finalMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: replyMarkup,
        });
    }
}
