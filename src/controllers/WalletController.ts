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
    async queryMatatakiAccountTokenByUsername({ reply, message, i18n }: MessageHandlerContext,
        @InjectRegexMatchGroup(1) username: string,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string) {
        const targetId = await this.userRepo.getIdByUsername(username);
        if (!targetId) {
            await reply(i18n.t("error.usernameNotSynced"), {
                reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
            });
            return;
        }

        const minetokenId = await this.matatakiService.getMinetokenIdFromSymbol(symbol);
        const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(minetokenId);
        const walletAddress = await this.matatakiService.getEthWallet(targetId);

        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

        await reply(`${balance} ${symbol}`, {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query", /$/)
    @RequireMatatakiAccount()
    async queryMyTokens({ message, replyWithMarkdown, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() info: AssociatedInfo) {
        const array = new Array<string>();

        if (!info.user) {
            array.push(i18n.t("common.associatedMatatakiAccount.no"));
        } else {
            array.push(i18n.t("common.associatedMatatakiAccount.yes"));
        }

        if (!info.minetoken) {
            array.push(i18n.t("common.mintedMinetoken.no"));
        } else {
            array.push(i18n.t("common.mintedMinetoken.yes"));
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

            array.push(i18n.t("wallet.query.minetoken.header"));

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
    async queryToken({ message, replyWithMarkdown, i18n }: MessageHandlerContext) {
        await replyWithMarkdown(i18n.t("wallet.query.badFormat"), {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("transfer", { ignorePrefix: true })
    @RequireMatatakiAccount()
    async transfer({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<Omit<AssociatedInfo, "minetoken">>) {
        const match = /^\/transfer(?:@[\w_]+)?\s+(\d+|@[\w_]{5,32})\s+(\w+)\s+(\d+.?\d*)/.exec(message.text);
        if (!match || match.length < 4) {
            await replyWithMarkdown(i18n.t("wallet.transfer.badFormat"));
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

        let commonMessage = i18n.t("wallet.transfer.common", {
            senderUsername: senderInfo.user.name,
            senderUrl: `${this.matatakiService.urlPrefix}user/${senderInfo.user.id}`,
            receiverUsername: targetName,
            receiverUrl: `${this.matatakiService.urlPrefix}user/${userId}`,
            amount, symbol,
        });
        const transactionMessage = await replyWithMarkdown(`${i18n.t("wallet.transfer.started")}\n\n${commonMessage}`, { disable_web_page_preview: true });

        let finalMessage, replyMarkup;
        try {
            const tx_hash = await this.matatakiService.transfer(senderInfo.user.id, userId, symbol, amount);

            finalMessage = `${i18n.t("wallet.transfer.successful")}\n\n${commonMessage}`;

            replyMarkup = Markup.inlineKeyboard([
                [Markup.urlButton(i18n.t("wallet.transfer.transactionDetail"), `https://rinkeby.etherscan.io/tx/${tx_hash}`)]
            ]);
        } catch {
            finalMessage = `${i18n.t("wallet.transfer.failed")}\n\n${commonMessage}`;
        }

        await telegram.editMessageText(message.chat.id, transactionMessage.message_id, undefined, finalMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: replyMarkup,
        });
    }
}
