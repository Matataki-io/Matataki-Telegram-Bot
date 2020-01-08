import { inject } from "inversify";
import { Extra, Markup } from "telegraf";
import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { Controller, Command, InjectRepository, Event } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Group, User } from "#/entities";
import { Injections, LogCategories } from "#/constants";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IBotService, IMatatakiService, IWeb3Service, ILoggerService } from "#/services";

import { BaseController } from ".";
import { table } from "table";

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
    async listMyGroups({ message, reply, telegram }: MessageHandlerContext) {
        const sender = message.from.id;

        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user || !info.minetoken) {
            await reply("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            return;
        }

        const groups = await this.groupRepo.getGroupsOfCreator(sender);

        if (groups.length === 0) {
            await reply(`抱歉，您还没有创建 Fan票 群`);
            return;
        }

        const groupNames = new Map<Group, string>();

        await Promise.all(groups.map(async group => {
            const info = await telegram.getChat(group.id);
            if (!info.title) {
                throw new Error("What happened?");
            }

            groupNames.set(group, info.title);
        }));

        const array = new Array<string>();

        for (const group of groups) {
            array.push(`群组 ID：${group.id}
名字：${groupNames.get(group)}
Fan 票：${info.minetoken?.symbol}
最低要求：${group.requirement.minetoken?.amount ?? 0}`);
        }

        await reply(array.join("\n=====================\n"));
    }

    @Command("rule", { ignorePrefix: true })
    async getCurrentGroupRules({ message, reply }: MessageHandlerContext) {
        const { chat } = message;

        if (chat.type !== "group" && chat.type !== "supergroup") {
            await reply("该命令仅限群聊里使用");
            return;
        }

        const group = await this.groupRepo.getGroupOrDefault(chat.id);
        if (!group) {
            await reply("该群还不是 Fan 票粉丝群");
            return;
        }

        const info = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

        if (!info.minetoken) {
            throw new Error("Impossible situation");
        }

        if (group.requirement.minetoken && group.requirement.minetoken.amount > 0) {
            await reply(`该群目前要求 ${info.minetoken.symbol} ≥ ${group.requirement.minetoken.amount}`);
        } else {
            await reply(`该群目前没有 ${info.minetoken.symbol} 要求`);
        }
    }

    @Command("set", { ignorePrefix: true })
    async setGroupRequirement({ message, reply, telegram }: MessageHandlerContext) {
        const sender = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user || !info.minetoken) {
            await reply("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票");
            return;
        }

        const match = /^\/set\s+-?(\d+)\s+(\d+.?\d*)/.exec(message.text);
        if (!match || match.length < 2) {
            return reply("格式不对，请输入 `/set group_id amount`");
        }

        const groupId = -Number(match[1]);
        const groups = await this.groupRepo.getGroupsOfCreator(sender);
        const group = groups.find(group => Number(group.id) === groupId);

        if (!group) {
            await reply(`没有找到该群`);
            return;
        }

        const administrators = await telegram.getChatAdministrators(groupId);
        const me = administrators.find(admin => admin.user.id === this.botService.info.id);
        if (!me || !me.can_invite_users) {
            await reply("请把机器人设置为管理员并设置邀请用户权限");
            return;
        }

        const amount = Number(match[2]);
        await this.groupRepo.setRequirement(group, amount);

        await reply("OK");

        await telegram.sendMessage(groupId, `当前群规则已修改为：
群组 ID：${groupId}
名字：${group.title}
Fan 票：${info.minetoken.symbol}
最低要求：${amount}`);

        return true;
    }

    @Command("join", { ignorePrefix: true })
    async joinGroup({ message, reply, telegram }: MessageHandlerContext) {
        const { chat } = message;

        if (chat.type !== "private") {
            await reply("该命令仅限和机器人私聊里使用");
            return;
        }

        const sender = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user) {
            await reply("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
            return;
        }

        const groups = await this.groupRepo.getGroupsExceptMyToken(info.minetoken?.id);

        const tokens = new Set<number>();
        for (const group of groups) {
            tokens.add(group.tokenId);
        }

        const walletAddress = await this.matatakiService.getEthWallet(sender);;
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
            await reply(`抱歉，您持有的 Fan票 不足以加入别的群

输入 /status 查看已经加入的 Fan票 群`);
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

                array.push(`/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.tokenId)} ≥ ${requiredAmount}` : "暂无规则"}）`);
            } catch (e) {
                this.loggerService.error(LogCategories.TelegramUpdate, e);
            }
        }

        array.unshift(`*您现在还可以加入 ${joinableGroupCount} 个 Fan票 群*`);

        array.push("");
        array.push("输入 /status 查看已经加入的 Fan票 群");

        await telegram.sendMessage(message.chat.id, array.join("\n"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Event("new_chat_members")
    async onNewMemberEnter({ message, reply, telegram }: MessageHandlerContext) {
        if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
            console.log("Not support private and channel");
            return;
        }

        let group: Group;

        const groupId = message.chat.id;
        const groupInfo = await telegram.getChat(groupId);
        const groupName = groupInfo.title;

        const inviterId = message.from.id;

        let newMembers = message.new_chat_members ?? [];
        const me = newMembers.find(member => member.id === this.botService.info.id);
        if (!me) {
            group = await this.groupRepo.getGroup(groupId);
        } else {
            const administrators = await telegram.getChatAdministrators(groupId);
            const creator = administrators.find(admin => admin.status === "creator");
            if (!creator) {
                throw new Error("Impossible situation");
            }

            const creatorId = creator.user.id;
            if (inviterId !== creatorId) {
                await reply("邀请者不是群主，立即退出");
                await telegram.leaveChat(groupId);
                return;
            }

            const info = await this.matatakiService.getAssociatedInfo(inviterId);
            if (!info.user || !info.minetoken) {
                await reply("群主没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票，立即退出");
                await telegram.leaveChat(groupId);
                return;
            }

            group = await this.groupRepo.ensureGroup(groupId, groupName ?? "", creator.user.id, info.minetoken.id);

            await this.botService.sendMessage(creatorId, `您已把机器人拉进群 **${groupName}**。为了机器人的正常工作，请把机器人设置为管理员并取消群员拉人权限`);

            if (groupInfo.type === "group") {
                await this.botService.sendMessage(creatorId, `**${groupName}** 现在是一个小群，对于机器人的正常工作存在一定影响，建议采取一些操作升级到大群。包括但不限于以下操作：
- 临时转公开并设置群链接
- 修改任意管理员操作权限`);
            }
        }

        const acceptedUsers = new Set<TelegramUser>();

        for (const member of newMembers) {
            if (member.is_bot) {
                continue;
            }

            const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(group.tokenId);
            const requirement = group.requirement.minetoken?.amount ?? 0;

            let walletAddress: string;
            try {
                walletAddress = await this.matatakiService.getEthWallet(member.id);
            } catch (e) {
                try {
                    await this.botService.kickMember(groupId, member.id);
                    await this.botService.sendMessage(member.id, `抱歉，您现在没有绑定 瞬Matataki，现已被移出`);
                } catch (e) {
                    this.loggerService.warn(LogCategories.TelegramUpdate, e);
                }
                continue;
            }

            const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

            if (balance >= requirement) {
                acceptedUsers.add(member);
                continue;
            }

            try {
                await this.botService.kickMember(groupId, member.id);
                await this.botService.sendMessage(member.id, `抱歉，您现在的 Fan 票不满足群 ${groupName} 的条件，现已被移出`);
            } catch (e) {
                this.loggerService.warn(LogCategories.TelegramUpdate, e);
            }
        }

        if (acceptedUsers.size === 0) {
            return;
        }

        const members = await Promise.all(Array.from(acceptedUsers).map(member => this.userRepo.ensureUser(member.id)));

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
        const group = await this.groupRepo.getGroup(groupId);

        if (member.is_bot && member.id === this.botService.info.id) {

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

        const info = await this.matatakiService.getAssociatedInfo(inviterId);
        if (!info.user || !info.minetoken) {
            await reply("群主没有在 瞬Matataki 绑定该 Telegram 帐号或者尚未发行 Fan 票，立即退出");
            await telegram.leaveChat(groupId);
            return;
        }

        await this.groupRepo.ensureGroup(groupId, title ?? "", inviterId, info.minetoken.id);
    }
    @Event("migrate_to_chat_id")
    async onGroupMigration({ message }: MessageHandlerContext) {
        if (!message.migrate_to_chat_id) {
            throw new Error("Impossible situation");
        }

        const group = await this.groupRepo.getGroup(message.chat.id);

        await this.groupRepo.changeGroupId(group, message.migrate_to_chat_id);
    }

    @Event("new_chat_title")
    async onGroupTitleChanged({ message }: MessageHandlerContext) {
        if (!message.new_chat_title) {
            throw new Error("Impossible situation");
        }

        const group = await this.groupRepo.getGroup(message.chat.id);

        await this.groupRepo.changeGroupTitle(group, message.new_chat_title);
    }

    async joinGroupWithStartPayload({ reply, message, telegram }: MessageHandlerContext, groupId: number): Promise<boolean> {
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

            await reply("您是该群群主：", Markup.inlineKeyboard([button]).extra());
            return true;
        }

        const info = await this.matatakiService.getAssociatedInfo(sender);
        if (!info.user) {
            await reply("抱歉，您没有在 瞬Matataki 绑定该 Telegram 帐号");
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
            await reply(`抱歉，您持有的 Fan票 不满足群 ${group.title} 的条件：
要求 ${minetoken.name}(${minetoken.symbol}) >= ${groupRequirement}`);
            return true;
        }

        const chatMember = await telegram.getChatMember(groupId, sender);
        if (chatMember.status === "member") {
            const button = Markup.urlButton(group.title, await telegram.exportChatInviteLink(groupId));

            await reply("您已经是该 Fan票 群群员：", Markup.inlineKeyboard([button]).extra());
            return true;
        }

        if (chatMember.status === "kicked") {
            // @ts-ignore
            await telegram.unbanChatMember(groupId, sender);
        }

        const button = Markup.urlButton(group.title, await telegram.exportChatInviteLink(groupId));

        await reply("您现在可以进入该群：：", Markup.inlineKeyboard([button]).extra());
        return true;
    }
}
