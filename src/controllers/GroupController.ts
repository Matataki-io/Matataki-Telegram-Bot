import { inject } from "inversify";
import { Extra, Markup } from "telegraf";
import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { Controller, Command, InjectRepository, Event, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, SenderMatatakiInfo, RequireMintedMinetoken } from "#/decorators";
import { MessageHandlerContext, AssociatedInfo } from "#/definitions";
import { Group, User } from "#/entities";
import { Injections, LogCategories } from "#/constants";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IBotService, IMatatakiService, IWeb3Service, ILoggerService } from "#/services";

import { BaseController } from ".";
import { table } from "table";
import { allPromiseSettled } from "#/utils";
import moment = require("moment");

@Controller("group")
export class GroupController extends BaseController<GroupController> {
    constructor(
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @inject(Injections.BotService) private botService: IBotService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
        super();
    }

    @Command("mygroups", { ignorePrefix: true })
    @RequireMintedMinetoken()
    async listMyGroups({ message, reply, telegram, i18n }: MessageHandlerContext, @SenderMatatakiInfo() senderInfo: Required<AssociatedInfo>) {
        const groups = await this.groupRepo.getGroupsOfCreator(message.from.id);

        if (groups.length === 0) {
            await reply(i18n.t("status.notCreatedGroups"));
            return;
        }

        const array = new Array<string>();
        const results = (await allPromiseSettled(groups.map(async group => {
            const groupId = Number(group.id);
            const groupInfo = await telegram.getChat(groupId);

            const memberCount = await telegram.getChatMembersCount(groupId);
            if (memberCount === 1) {
                return null;
            }

            const admins = await telegram.getChatAdministrators(groupId);
            let hasCreator = false;
            let hasMe = false;
            for (const admin of admins) {
                if (admin.status === "creator") {
                    hasCreator = true;
                    continue;
                }

                if (admin.user.id === this.botService.info.id) {
                    hasMe = true;
                }
            }
            if (!hasCreator || !hasMe) {
                return null;
            }

            return i18n.t("mygroups.reply", {
                id: group.id,
                title: groupInfo.title,
                symbol: senderInfo.minetoken.symbol,
                amount: group.requirement.minetoken?.amount ?? "未设置",
            });
        })));

        for (const result of results) {
            if (result.status === "rejected") {
                continue;
            }

            if (result.value) {
                array.push(result.value);
            }
        }

        let content = array.length === 0 ? i18n.t("status.notCreatedGroups") : array.join("\n=====================\n");

        content += `

` + i18n.t("mygroups.needAdmin");

        await reply(content);
    }

    @Command("rule", { ignorePrefix: true })
    @GroupOnly()
    async getCurrentGroupRules({ message, reply, i18n }: MessageHandlerContext) {
        const { chat } = message;

        const group = await this.groupRepo.getGroupOrDefault(chat.id);
        if (!group) {
            await reply(i18n.t("rule.notFanGroups"));
            return;
        }

        const info = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

        if (!info.minetoken) {
            throw new Error("Impossible situation");
        }

        if (group.requirement.minetoken && group.requirement.minetoken.amount > 0) {
            await reply(i18n.t("rule.addCondition", {
                symbol: info.minetoken.symbol,
                amount: group.requirement.minetoken.amount
            }));
        } else {
            await reply(i18n.t("rule.noConditions", {
                symbol: info.minetoken.symbol
            }));
        }
    }

    @Command("set", { ignorePrefix: true })
    @RequireMintedMinetoken()
    async setGroupRequirement({ message, reply, telegram, i18n }: MessageHandlerContext, @SenderMatatakiInfo() senderInfo: Required<AssociatedInfo>) {
        const match = /^\/set\s+-?(\d+)\s+(\d+.?\d*)/.exec(message.text);
        if (!match || match.length < 3) {
            return reply(i18n.t("set.wrongFormat"));
        }

        const groupId = -Number(match[1]);
        const groups = await this.groupRepo.getGroupsOfCreator(message.from.id);
        const group = groups.find(group => Number(group.id) === groupId);

        if (!group) {
            await reply(i18n.t("set.noGroupFound"));
            return;
        }

        const administrators = await telegram.getChatAdministrators(groupId);
        let hasCreator = false;
        let hasMe = false;
        for (const admin of administrators) {
            if (admin.status === "creator") {
                hasCreator = true;
                continue;
            }

            if (admin.user.id === this.botService.info.id) {
                hasMe = admin.can_invite_users ?? false;
            }
        }
        if (!hasCreator) {
            await reply(i18n.t("set.retired"));
            return;
        }
        if (!hasMe) {
            await reply(i18n.t("set.needAdmin"));
            return;
        }

        const amount = Number(match[2]);
        await this.groupRepo.setRequirement(group, amount);

        await reply("OK");

        await telegram.sendMessage(groupId, i18n.t("set.reply"));

        return true;
    }

    @Command("join", { ignorePrefix: true })
    @PrivateChatOnly()
    @RequireMatatakiAccount()
    async joinGroup({ message, reply, telegram, i18n }: MessageHandlerContext, @SenderMatatakiInfo() info: AssociatedInfo) {
        const sender = message.from.id;
        const groups = await this.groupRepo.getGroupsExceptMyToken(info.minetoken?.id);

        const tokens = new Set<number>();
        for (const group of groups) {
            tokens.add(group.tokenId);
        }

        const walletAddress = await this.matatakiService.getEthWallet(sender);
        const balanceCache = new Map<number, number>();
        await Promise.all(Array.from(tokens).map(async token => {
            const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(token);
            const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

            balanceCache.set(token, balance!);
        }));

        const tableArray = [["Token", "Balance"]];

        for (const token of tokens) {
            tableArray.push([token.toString(), balanceCache.get(token)?.toString() ?? ""]);
        }

        const tableString = table(tableArray);
        console.log(tableString);
        this.loggerService.trace(LogCategories.TelegramUpdate, tableString);

        const acceptableGroups = groups.filter(group => (balanceCache.get(group.tokenId) ?? -1) >= (group.requirement.minetoken?.amount ?? 0));
        if (acceptableGroups.length === 0) {
            await reply(i18n.t("join.insufficientToken"));
            return;
        }

        const symbolMap = new Map<number, string>();
        for (const group of acceptableGroups) {
            if (symbolMap.has(group.tokenId)) {
                continue;
            }

            const info = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

            symbolMap.set(group.tokenId, info.minetoken!.symbol);
        }

        const array = new Array<string>();
        let joinableGroupCount = 0;

        for (const group of acceptableGroups) {
            const groupId = Number(group.id);
            const groupInfo = await telegram.getChat(groupId);
            if (!groupInfo.title) {
                throw new Error("What happened?");
            }

            const { status } = await telegram.getChatMember(groupId, sender);
            if (status === "kicked") {
                // @ts-ignore
                await telegram.unbanChatMember(groupId, sender);
            }
            if (status !== "left") {
                continue;
            }

            try {
                const inviteLink = groupInfo.invite_link ?? await telegram.exportChatInviteLink(groupId);
                const requiredAmount = group.requirement.minetoken?.amount ?? 0;

                joinableGroupCount++;

                array.push(`/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.tokenId)} ≥ ${requiredAmount}` : i18n.t("join.noRules")}）`);
            } catch (e) {
                this.loggerService.error(LogCategories.TelegramUpdate, e);
            }
        }

        array.unshift(i18n.t("join.remainingGroups"));

        array.push("");
        array.push(i18n.t("join.joinedGroups"));

        await telegram.sendMessage(message.chat.id, array.join("\n"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Event("new_chat_members")
    async onNewMemberEnter({ message, telegram, i18n }: MessageHandlerContext) {
        const { id: groupId, type, title } = message.chat;
        if (type !== "group" && type !== "supergroup") {
            console.log("Not support private and channel");
            return;
        }

        const administrators = await telegram.getChatAdministrators(groupId);
        const creator = administrators.find(admin => admin.status === "creator");

        const group = await this.groupRepo.ensureGroup(groupId, title ?? "", creator?.user.id ?? -1, -1);

        let newMembers = message.new_chat_members ?? [];

        const acceptedUsers = new Set<TelegramUser>();

        for (const member of newMembers) {
            if (member.is_bot) {
                continue;
            }
            if (member.id === Number(group.creatorId)) {
                continue;
            }

            if (group.requirement.minetoken) {
                const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(group.tokenId);
                const requirement = group.requirement.minetoken.amount;

                let walletAddress: string;
                try {
                    walletAddress = await this.matatakiService.getEthWallet(member.id);
                } catch (e) {
                    try {
                        await this.botService.kickMember(groupId, member.id);
                        await this.botService.sendMessage(member.id, i18n.t("expel.notUser"));
                    } catch (e) {
                        this.loggerService.warn(LogCategories.TelegramUpdate, e);
                    }
                    continue;
                }

                const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

                if (balance < requirement) {
                    try {
                        await this.botService.kickMember(groupId, member.id);
                        await this.botService.sendMessage(member.id, i18n.t("expel.insufficientToken"));
                    } catch (e) {
                        this.loggerService.warn(LogCategories.TelegramUpdate, e);
                    }
                    continue;
                }
            }

            acceptedUsers.add(member);
        }

        if (acceptedUsers.size === 0) {
            return;
        }

        const members = await Promise.all(Array.from(acceptedUsers).map(member => this.userRepo.ensureUser(member.id, member.username)));

        await this.groupRepo.addMembers(group, members);
    }

    @Event("left_chat_member")
    async onMemberLeft({ message, telegram }: MessageHandlerContext) {
        if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
            console.log("Not support private and channel");
            return;
        }

        const member = message.left_chat_member;
        if (!member) {
            throw new Error("What happened?");
        }

        const groupId = message.chat.id;
        const group = await this.groupRepo.getGroupOrDefault(groupId, true);
        if (!group) {
            return;
        }

        if (member.is_bot) {
            if (member.id === this.botService.info.id) {
                await this.groupRepo.setActive(group, false);
            }
            return;
        }

        if (member.id === Number(group.creatorId)) {
            await this.groupRepo.setActive(group, false);
            return;
        }

        const user = group.members.find(user => Number(user.id) === member.id);
        if (!user) {
            console.log(`The user ${member.id} (${member.username}) is not in group ${groupId} (${message.chat.title})`);
            return;
        }

        await this.groupRepo.removeMember(group, user);
    }

    @Event(["group_chat_created", "supergroup_chat_created"])
    async onGroupCreated({ message, reply, telegram }: MessageHandlerContext) {
        const { id: groupId, title } = message.chat;
        const inviterId = message.from.id;

        await this.groupRepo.ensureGroup(groupId, title ?? "", inviterId, -1);
    }
    @Event("migrate_to_chat_id")
    async onGroupMigration({ message }: MessageHandlerContext) {
        if (!message.migrate_to_chat_id) {
            throw new Error("Impossible situation");
        }

        await this.groupRepo.changeGroupId(message.chat.id, message.migrate_to_chat_id);
    }

    @Event("new_chat_title")
    async onGroupTitleChanged({ message }: MessageHandlerContext) {
        if (!message.new_chat_title) {
            throw new Error("Impossible situation");
        }

        const group = await this.groupRepo.getGroup(message.chat.id);

        await this.groupRepo.changeGroupTitle(group, message.new_chat_title);
    }

    async joinGroupWithStartPayload({ reply, message, telegram, i18n }: MessageHandlerContext, groupId: number): Promise<boolean> {
        let group: Group;
        try {
            group = await this.groupRepo.getGroup(groupId);
        } catch (e) {
            this.loggerService.error(LogCategories.TelegramUpdate, "GroupId not found", groupId);
            return false;
        }

        const sender = message.from.id;

        if (sender === Number(group.creatorId)) {
            const button = Markup.urlButton(group.title, await telegram.exportChatInviteLink(groupId));

            await reply(i18n.t("joinGroup.iAmTheOwner"), Markup.inlineKeyboard([button]).extra());
            return true;
        }

        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user) {
            await reply(i18n.t("status.notUser"));
            return true;
        }

        const groupRequirement = group.requirement.minetoken?.amount ?? 0;

        const walletAddress = await this.matatakiService.getEthWallet(sender);;
        const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(group.tokenId);
        const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

        const { minetoken } = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

        if (!minetoken) {
            throw new Error("Impossible situation");
        }

        if (balance < groupRequirement) {
            await reply(i18n.t("joinGroup.insufficientToken"));
            return true;
        }

        const chatMember = await telegram.getChatMember(groupId, sender);
        if (chatMember.status === "member") {
            const button = Markup.urlButton(group.title, await telegram.exportChatInviteLink(groupId));

            await reply(i18n.t("joinGroup.joined"), Markup.inlineKeyboard([button]).extra());
            return true;
        }

        if (chatMember.status === "kicked") {
            // @ts-ignore
            await telegram.unbanChatMember(groupId, sender);
        }

        const button = Markup.urlButton(group.title, await telegram.exportChatInviteLink(groupId));

        await reply(i18n.t("joinGroup.canJoin"), Markup.inlineKeyboard([button]).extra());
        return true;
    }

    @Command("kick", { ignorePrefix: true })
    @GroupOnly()
    async kickMember({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext) {
        const { chat } = message;

        const match = /^\/kick(?:@[\w_]+)?\s+@([\w_]{5,32})\s+(\d+)/.exec(message.text);
        if (!match || match.length < 3) {
            await replyWithMarkdown(i18n.t("kick.wrongFormat"));
            return;
        }

        /*
        const sender = message.from.id;
        const senderInfo = await this.matatakiService.getAssociatedInfo(sender);
        if (!senderInfo.user) {
            await replyWithMarkdown("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            return;
        }*/

        const target = match[1];
        const targetId = await this.userRepo.getIdByUsername(target);
        if (!targetId) {
            await replyWithMarkdown(i18n.t("kick.notUser"));
            return;
        }

        // const group = await this.groupRepo.getGroup(chat.id);

        /*const creatorInfo = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));
        if (!creatorInfo.user) {
            await replyWithMarkdown("抱歉，目标帐号没有在 瞬Matataki 绑定 Telegram 帐号");
            return;
        }*/

        // const symbol = creatorInfo.minetoken!.symbol;
        const transactionMessage = await replyWithMarkdown(i18n.t("kick.loading"));

        let finalMessage;
        try {
            /*
            if (message.from.id !== Number(group.creatorId)) {
                await this.matatakiService.transfer(senderInfo.user.id, creatorInfo.user.id, symbol, 10000);
            }*/

            const time = Number(match[2]);
            const untilDateTimestamp = Math.round(Date.now() / 1000) + time * 60;

            // @ts-ignore

            await telegram.kickChatMember(chat.id, targetId, untilDateTimestamp);

            const untilDate = moment.unix(untilDateTimestamp);

            finalMessage = i18n.t("kick.success");
        } catch {
            replyWithMarkdown(targetId.toString());
            replyWithMarkdown(chat.id.toString());
            finalMessage = i18n.t("kick.error");
        }

        await telegram.editMessageText(chat.id, transactionMessage.message_id, undefined, finalMessage);
    }

    @Command("ban", { ignorePrefix: true })
    @GroupOnly()
    async banMember({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext) {
        const { chat } = message;

        const match = /^\/ban(?:@[\w_]+)?\s+@([\w_]{5,32})\s+(\d+)/.exec(message.text);
        if (!match || match.length < 3) {
            await replyWithMarkdown(i18n.t("ban.wrongFormat"));
            return;
        }

        /*
        const sender = message.from.id;
        const senderInfo = await this.matatakiService.getAssociatedInfo(sender);
        if (!senderInfo.user) {
            await replyWithMarkdown("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            return;
        }*/

        const target = match[1];
        const targetId = await this.userRepo.getIdByUsername(target);
        if (!targetId) {
            await replyWithMarkdown(i18n.t("kick.notUser"));
            return;
        }

        // const group = await this.groupRepo.getGroup(chat.id);

        /*const creatorInfo = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));
        if (!creatorInfo.user) {
            await replyWithMarkdown("抱歉，目标帐号没有在 瞬Matataki 绑定 Telegram 帐号");
            return;
        }*/

        // const symbol = creatorInfo.minetoken!.symbol;
        const transactionMessage = await replyWithMarkdown(i18n.t("ban.loading"));

        let finalMessage;
        try {
            /*
            if (message.from.id !== Number(group.creatorId)) {
                await this.matatakiService.transfer(senderInfo.user.id, creatorInfo.user.id, symbol, 10000);
            }*/

            const time = Number(match[2]);
            const untilDateTimestamp = Math.round(Date.now() / 1000) + time * 60;

            await telegram.restrictChatMember(chat.id, targetId, {
                until_date: untilDateTimestamp as any,
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false,
            });

            const untilDate = moment.unix(untilDateTimestamp);

            finalMessage = i18n.t("ban.success");
        } catch {
            finalMessage = i18n.t("ban.error");
        }

        await telegram.editMessageText(chat.id, transactionMessage.message_id, undefined, finalMessage);
    }
}
