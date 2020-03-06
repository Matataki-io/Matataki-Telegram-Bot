import { inject } from "inversify";
import { Extra, Markup } from "telegraf";
import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { Controller, Command, InjectRepository, Event, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, InjectSenderMatatakiInfo, RequireMintedMinetoken } from "#/decorators";
import { MessageHandlerContext, AssociatedInfo } from "#/definitions";
import { Group, User, FandomGroupRequirement } from "#/entities";
import { Injections, LogCategories } from "#/constants";
import { IUserRepository, IGroupRepository, IFandomGroupRequirementRepository } from "#/repositories";
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
        @InjectRepository(FandomGroupRequirement) private fandomGroupReqRepo: IFandomGroupRequirementRepository,
        @inject(Injections.BotService) private botService: IBotService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService) {
        super();
    }

    @Command("mygroups", { ignorePrefix: true })
    @RequireMintedMinetoken()
    async listMyGroups({ message, reply, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<AssociatedInfo>) {

    }

    @Command("rule", { ignorePrefix: true })
    @GroupOnly()
    async getCurrentGroupRules({ message, reply, i18n }: MessageHandlerContext) {

    }

    @Command("set", { ignorePrefix: true })
    @RequireMintedMinetoken()
    async setGroupRequirement({ message, reply, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<AssociatedInfo>) {

    }

    @Command("join", { ignorePrefix: true })
    @PrivateChatOnly()
    @RequireMatatakiAccount()
    async joinGroup({ message, reply, telegram, i18n }: MessageHandlerContext, @InjectSenderMatatakiInfo() info: AssociatedInfo) {

    }

    @Event("new_chat_members")
    async onNewMemberEnter({ message, telegram, i18n }: MessageHandlerContext) {
        let group = await this.groupRepo.getGroupOrDefault(message.chat.id);

        const newMembers = new Array<User>();

        for (const member of message.new_chat_members ?? []) {
            if (member.is_bot) {
                continue;
            }

            const user = await this.userRepo.ensureUser(member);

            newMembers.push(user);
        }

        if (!group) {
            const creator = (await telegram.getChatAdministrators(message.chat.id)).find(m => m.status === "creator")!;

            group = await this.groupRepo.ensureGroup(message.chat, creator.user.id);
            group.members = [];
        }

        await this.groupRepo.addMembers(group, newMembers);
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

            finalMessage = i18n.t("kick.success", {
                format: untilDate.format("lll")
            });
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

            finalMessage = i18n.t("ban.success", {
                format: untilDate.format("lll")
            });
        } catch {
            finalMessage = i18n.t("ban.error");
        }

        await telegram.editMessageText(chat.id, transactionMessage.message_id, undefined, finalMessage);
    }
}
