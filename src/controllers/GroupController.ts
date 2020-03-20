import { inject } from "inversify";
import { Extra, Markup } from "telegraf";
import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { Controller, Command, InjectRepository, Event, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, InjectSenderMatatakiInfo, RequireMintedMinetoken, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { MessageHandlerContext, UserInfo } from "#/definitions";
import { Group, User, FandomGroupRequirement } from "#/entities";
import { Injections, LogCategories } from "#/constants";
import { IUserRepository, IGroupRepository, IFandomGroupRequirementRepository } from "#/repositories";
import { IBotService, IWeb3Service, ILoggerService, IBackendApiService } from "#/services";

import { BaseController } from ".";
import { table } from "table";
import { allPromiseSettled } from "#/utils";
import moment = require("moment");

@Controller("group")
@GlobalAlias("mygroups", "mygroups")
@GlobalAlias("rule", "rule")
@GlobalAlias("set", "set")
@GlobalAlias("join", "join")
export class GroupController extends BaseController<GroupController> {
    constructor(
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @InjectRepository(FandomGroupRequirement) private fandomGroupReqRepo: IFandomGroupRequirementRepository,
        @inject(Injections.BotService) private botService: IBotService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.BackendApiService) private backendService: IBackendApiService) {
        super();
    }

    @Command("mygroups", { ignorePrefix: true })
    @RequireMintedMinetoken()
    async listMyGroups({ message, reply, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() user: UserInfo) {
        const groups = await this.groupRepo.getGroupsOfCreator(message.from.id);

        if (groups.length === 0) {
            await reply(i18n.t("group.mygroups.noAnyGroup"));
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

            return i18n.t("group.mygroups.groupInfo", {
                id: group.id,
                title: groupInfo.title,
                symbol: user.issuedTokens[0].symbol,
                amount: group.requirements.length > 0 ? group.requirements[0].amount : i18n.t("group.mygroups.noAnyRule"),
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

        let content = array.length === 0 ? i18n.t("group.mygroups.noAny") : array.join("\n=====================\n");

        content += `

` + i18n.t("group.mygroups.tip");

        await reply(content);
    }

    @Command("rule", { ignorePrefix: true })
    @GroupOnly()
    async getCurrentGroupRules({ message, reply, i18n }: MessageHandlerContext) {
        const group = await this.groupRepo.getGroupOrDefault(message.chat.id);
        if (!group) {
            await reply(i18n.t("error.notFandomGroup"));
            return;
        }

        const user = await this.backendService.getUserByTelegramId(Number(group.creatorId));
        if (user.issuedTokens.length === 0) {
            throw new Error("Impossible situation");
        }

        if (group.requirements.length > 0) {
            await reply(i18n.t("group.rule.minetokenRequirement", {
                symbol: user.issuedTokens[0].symbol,
                amount: group.requirements[0].amount
            }));
        } else {
            await reply(i18n.t("group.rule.noRequirement", {
                symbol: user.issuedTokens[0].symbol
            }));
        }
    }

    @Command("set", /-?(\d+)\s+(\d+.?\d*)/, ({ t }) => t("group.setRequirement.badFormat"))
    @RequireMintedMinetoken()
    async setGroupRequirement({ message, reply, telegram, i18n }: MessageHandlerContext,
        @InjectSenderMatatakiInfo() user: UserInfo,
        @InjectRegexMatchGroup(1, input => -Number(input)) groupId: number,
        @InjectRegexMatchGroup(2, input => Number(input) * 10000) amount: number) {
        const groups = await this.groupRepo.getGroupsOfCreator(message.from.id);
        const group = groups.find(group => Number(group.id) === groupId);

        if (!group) {
            await reply(i18n.t("group.setRequirement.groupNotFound"));
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
            await reply(i18n.t("group.setRequirement.creatorLeft"));
            return;
        }
        if (!hasMe) {
            await reply(i18n.t("group.setRequirement.botNotAdmin"));
            return;
        }

        await this.fandomGroupReqRepo.set(group, user.issuedTokens[0].id, amount);

        await reply("OK");

        await telegram.sendMessage(groupId, i18n.t("group.setRequirement.notification", {
            groupId,
            title: group.title,
            symbol: user.issuedTokens[0].symbol,
            amount
        }));
    }

    @Command("join", { ignorePrefix: true })
    @PrivateChatOnly()
    @RequireMatatakiAccount()
    async joinGroup({ message, reply, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() info: UserInfo) {
    }

    @Event("new_chat_members")
    async onNewMemberEnter({ message, telegram, i18n }: MessageHandlerContext) {
        let group = await this.groupRepo.getGroupOrDefault(message.chat.id);

        const newMembers = new Set<User>();
        for (const member of message.new_chat_members ?? []) {
            if (member.is_bot) {
                continue;
            }

            const user = await this.userRepo.ensureUser(member);

            newMembers.add(user);
        }

        if (!group) {
            const creator = (await telegram.getChatAdministrators(message.chat.id)).find(m => m.status === "creator");

            group = await this.groupRepo.ensureGroup(message.chat, creator?.user.id ?? -1);
            group.members = [];
            group.requirements = [];
        }

        if (group.requirements.length === 0) {
            await this.groupRepo.addMembers(group, Array.from(newMembers));
            return;
        }

        const newMemberArray = Array.from(newMembers);
        newMembers.clear();

        const requirement = group.requirements[0];

        const results = await allPromiseSettled(newMemberArray.map(async member => {
            const { contractAddress } = await this.backendService.getToken(requirement.minetokenId);
            const { walletAddress } = await this.backendService.getUserByTelegramId(Number(member.id));

            const balance = await this.web3Service.getBalance(contractAddress, walletAddress) * 10000;
            console.log(balance)
            if (balance < requirement.amount) {
                await telegram.kickChatMember(message.chat.id, Number(member.id));

                return null;
            }

            return member;
        }));

        for (const result of results) {
            if (result.status === "rejected") {
                // TODO: How to handle rejected situation
                continue;
            }

            if (result.value) {
                newMembers.add(result.value);
            }
        }

        if (newMembers.size > 0) {
            await this.groupRepo.addMembers(group, Array.from(newMembers));
        }
    }

    @Event("left_chat_member")
    async onMemberLeft({ message, telegram }: MessageHandlerContext) {
        const leftMember = message.left_chat_member!;

        if (!leftMember.is_bot || leftMember.id !== this.botService.info.id) {
            return;
        }

        const group = await this.groupRepo.getGroupOrDefault(message.chat.id);
        if (!group || group.requirements.length === 0) {
            return;
        }

        await this.fandomGroupReqRepo.removeAll(group);
    }

    @Event(["group_chat_created", "supergroup_chat_created"])
    async onGroupCreated({ message }: MessageHandlerContext) {
        await this.groupRepo.ensureGroup(message.chat, message.from.id);
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
        return false;
    }

    @Command("kick", /@([\w_]{5,32})\s+(\d+)/, ({ t }) => t("group.kickMember.badFormat"))
    @GroupOnly()
    async kickMember({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext,
        @InjectRegexMatchGroup(1) target: string,
        @InjectRegexMatchGroup(2, Number) time: number
    ) {
        const { chat } = message;

        const targetId = await this.userRepo.getIdByUsername(target);
        if (!targetId) {
            await replyWithMarkdown(i18n.t("error.usernameNotFound"));
            return;
        }

        const transactionMessage = await replyWithMarkdown(i18n.t("group.kickMember.started"));

        let finalMessage;
        try {
            const untilDateTimestamp = Math.round(Date.now() / 1000) + time * 60;

            // @ts-ignore

            await telegram.kickChatMember(chat.id, targetId, untilDateTimestamp);

            const untilDate = moment.unix(untilDateTimestamp);

            finalMessage = i18n.t("group.kickMember.success", {
                format: untilDate.format("lll")
            });
        } catch {
            replyWithMarkdown(targetId.toString());
            replyWithMarkdown(chat.id.toString());
            finalMessage = i18n.t("group.kickMember.failure");
        }

        await telegram.editMessageText(chat.id, transactionMessage.message_id, undefined, finalMessage);
    }

    @Command("ban", /@([\w_]{5,32})\s+(\d+)/, ({ t }) => t("group.banMember.badFormat"))
    @GroupOnly()
    async banMember({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext,
        @InjectRegexMatchGroup(1) target: string,
        @InjectRegexMatchGroup(2, Number) time: number
    ) {
        const { chat } = message;

        const targetId = await this.userRepo.getIdByUsername(target);
        if (!targetId) {
            await replyWithMarkdown(i18n.t("error.usernameNotFound"));
            return;
        }

        const transactionMessage = await replyWithMarkdown(i18n.t("group.banMember.started"));

        let finalMessage;
        try {
            const untilDateTimestamp = Math.round(Date.now() / 1000) + time * 60;

            await telegram.restrictChatMember(chat.id, targetId, {
                until_date: untilDateTimestamp as any,
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false,
            });

            const untilDate = moment.unix(untilDateTimestamp);

            finalMessage = i18n.t("group.banMember.success", {
                format: untilDate.format("lll")
            });
        } catch {
            finalMessage = i18n.t("group.banMember.failure");
        }

        await telegram.editMessageText(chat.id, transactionMessage.message_id, undefined, finalMessage);
    }
}
