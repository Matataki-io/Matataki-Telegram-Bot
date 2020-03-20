import { inject } from "inversify";

import { Injections } from "#/constants";
import { Controller, Command, InjectRepository, InjectSenderMatatakiInfo, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { MessageHandlerContext, UserInfo } from "#/definitions";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";
import { IMatatakiService, IWeb3Service, IBackendApiService } from "#/services";
import { filterNotNull } from "#/utils";

import { BaseController } from ".";
import { Extra, Markup } from "telegraf";
import { RequireMatatakiAccount } from "#/decorators/RequireMatatakiAccount";

@Controller("wallet")
@GlobalAlias("query", "query")
@GlobalAlias("transfer", "transfer")
export class WalletController extends BaseController<WalletController> {
    constructor(
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.BackendApiService) private backendService: IBackendApiService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @InjectRepository(User) private userRepo: IUserRepository) {
        super();
    }

    @Command("query", /(\d+)\s+(\w+)/)
    async queryMatatakiAccountTokenById({ reply, message }: MessageHandlerContext,
        @InjectRegexMatchGroup(1, Number) matatakiId: number,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string) {
        const { contractAddress } = await this.backendService.getToken(symbol);
        const { walletAddress } = await this.backendService.getUser(matatakiId);

        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

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

        const { contractAddress } = await this.backendService.getToken(symbol);
        const { walletAddress } = await this.backendService.getUserByTelegramId(targetId);

        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

        await reply(`${balance} ${symbol}`, {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query", /$/)
    @RequireMatatakiAccount()
    async queryMyTokens({ message, replyWithMarkdown, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() user: UserInfo) {
        const array = new Array<string>();

        array.push(i18n.t("common.associatedMatatakiAccount.yes", {
            matatakiUsername: user.name,
            matatakiUserPageUrl: `${this.matatakiService.urlPrefix}/user/${user.id}`,
        }));

        if (user.issuedTokens.length === 0) {
            array.push(i18n.t("common.mintedMinetoken.no"));
        } else {
            array.push(i18n.t("common.mintedMinetoken.yes", {
                symbol: user.issuedTokens[0].symbol,
                minetokenName: user.issuedTokens[0].name,
                minetokenPageUrl: `${this.matatakiService.urlPrefix}/token/${user.issuedTokens[0].id}`,
            }));
        }

        array.push("");

        const { walletAddress } = await this.backendService.getUserByTelegramId(message.from.id);
        const minetokens = await this.backendService.getTokens();

        const balances = filterNotNull(await Promise.all(minetokens.map(async token => {
            const balance = await this.web3Service.getBalance(token.contractAddress, walletAddress);
            if (balance <= 0) {
                return null;
            }

            return `[${token.name}（${token.symbol}）](${this.matatakiService.urlPrefix}token/${token.id})： ${balance}`;
        })));

        array.push(i18n.t("wallet.query.minetoken.header"));

        for (const item of balances) {
            array.push(item);
        }

        await replyWithMarkdown(array.join("\n"), {
            disable_web_page_preview: true,
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("query")
    async queryBadFormat({ message, replyWithMarkdown, i18n }: MessageHandlerContext) {
        await replyWithMarkdown(i18n.t("wallet.query.badFormat"), {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }


    @Command("transfer", /(\d+)\s+(\w+)\s+(\d+.?\d*)/)
    @RequireMatatakiAccount()
    async transferByMatatakiId(ctx: MessageHandlerContext,
        @InjectRegexMatchGroup(1, Number) userId: number,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string,
        @InjectRegexMatchGroup(3, Number) amount: number,
        @InjectSenderMatatakiInfo() user: UserInfo
    ) {
        const { replyWithMarkdown, i18n } = ctx;

        const receiverInfo = await this.backendService.getUser(userId);
        if (!receiverInfo) {
            await replyWithMarkdown(i18n.t("error.matatakiAccountNotFound"));
            return;
        }

        const receiverUsername = receiverInfo.name;

        await this.transferCore(ctx, user.id, user.name, userId, receiverUsername, amount, symbol);
    }
    @Command("transfer", /@([\w_]{5,32})\s+(\w+)\s+(\d+.?\d*)/)
    @RequireMatatakiAccount()
    async transferByTelegramUsername(ctx: MessageHandlerContext,
        @InjectRegexMatchGroup(1) username: string,
        @InjectRegexMatchGroup(2, input => input.toUpperCase()) symbol: string,
        @InjectRegexMatchGroup(3, Number) amount: number,
        @InjectSenderMatatakiInfo() user: UserInfo
    ) {
        const { replyWithMarkdown, i18n } = ctx;

        const targetId = await this.userRepo.getIdByUsername(username);
        if (!targetId) {
            await replyWithMarkdown(i18n.t("error.usernameNotSynced"));
            return;
        }

        const targetUser = await this.backendService.getUser(targetId);
        if (!targetUser) {
            await replyWithMarkdown(i18n.t("error.requireMatatakiAccount"));
            return;
        }

        await this.transferCore(ctx, user.id, user.name, targetUser.id, targetUser.name, amount, symbol);
    }
    private async transferCore({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext,
        senderUserId: number,
        senderUsername: string,
        receiverUserId: number,
        receiverUsername: string,
        amount: number,
        symbol: string
    ) {
        let commonMessage = i18n.t("wallet.transfer.common", {
            senderUsername,
            senderUrl: `${this.matatakiService.urlPrefix}user/${senderUserId}`,
            receiverUsername,
            receiverUrl: `${this.matatakiService.urlPrefix}user/${receiverUserId}`,
            amount, symbol,
        });
        const transactionMessage = await replyWithMarkdown(`${i18n.t("wallet.transfer.started")}\n\n${commonMessage}`, { disable_web_page_preview: true });

        let finalMessage, replyMarkup;
        try {
            const tx_hash = await this.matatakiService.transfer(senderUserId, receiverUserId, symbol, amount);

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

    @Command("transfer")
    async transferBadFormat({ message, replyWithMarkdown, i18n }: MessageHandlerContext) {
        await replyWithMarkdown(i18n.t("wallet.transfer.badFormat"), {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }
}
