import { table } from "table";

import { Controller, Command, InjectRepository } from "../decorators";
import { MessageHandlerContext, IGroupRepository, IGroupRequirementRepository } from "../definitions";
import { BaseController } from "./BaseController";
import { Group, GroupRequirement } from "../entities";
import { inject } from "inversify";
import { Injections } from "../constants";
import { TestAccountBalanceService } from "../services";
import { Extra, Markup } from "telegraf";

@Controller("group")
export class GroupController extends BaseController<GroupController> {
    constructor(
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @InjectRepository(GroupRequirement) private requirementRepo: IGroupRequirementRepository,
        @inject(Injections.TestAccountBalanceService) private tbaService: TestAccountBalanceService) {
        super();
    }

    @Command("list_mygroups", { ignorePrefix: true })
    async listMyGroups({ message, reply, telegram }: MessageHandlerContext) {
        const sender = message.from.id;
        const groups = await this.groupRepo.getGroupsOfCreator(sender);

        if (groups.length === 0) {
            await reply(`没有找到符合以下所有条件的群：
            - 群主是你
            - 机器人是群成员`);
            return;
        }

        const names = new Map<Group, string>();

        await Promise.all(groups.map(async group => {
            const info = await telegram.getChat(group.id);
            if (!info.title) {
                throw new Error("What happened?");
            }

            names.set(group, info.title);
        }));

        const array = [
            ["群组 ID", "名字"]
        ];

        for (const group of groups) {
            array.push([group.id.toString(), names.get(group) ?? ""]);
        }

        await reply(table(array));
    }

    @Command("set_requirement", { ignorePrefix: true })
    async setGroupRequirement({ message, reply }: MessageHandlerContext) {
        const match = /^\/set_requirement (-?\d+) (\d+)$/.exec(message.text);
        if (!match || match.length < 2) {
            return reply("格式不对，请输入 `/set_requirement group_id amount`");
        }

        const sender = message.from.id;
        const groups = await this.groupRepo.getGroupsOfCreator(sender);
        if (groups.length === 0) {
            await reply(`没有找到符合以下所有条件的群：
            - 群主是你
            - 机器人是群成员`);
            return;
        }

        const groupId = Number(match[1]);
        const amount = Number(match[2]);

        const group = groups.find(group => Number(group.id) === groupId);
        if (!group) {
            await reply(`没有找到符合以下所有条件的群：
            - 群主是你
            - 机器人是群成员`);
            return;
        }

        await this.requirementRepo.setRequiredAmount(group, amount);

        await reply("OK");
        return true;
    }

    @Command("join_groups", { ignorePrefix: true })
    async joinGroup({ message, reply, telegram }: MessageHandlerContext) {
        const sender = message.from.id;

        if (sender !== 1019938473 && sender !== 972107339) {
            await reply("暂时不支持");
            return;
        }

        const balance = this.tbaService.getBalance(sender);

        const groups = await this.groupRepo.getGroups();
        const acceptableGroups = groups.filter(group => group.requirements.length === 0 || balance >= group.requirements[0].amount);
        if (acceptableGroups.length === 0) {
            await reply("抱歉，你的余额不足以进群");
            return;
        }

        const buttons = await Promise.all(acceptableGroups.map(async group => {
            const groupId = Number(group.id);
            const info = await telegram.getChat(groupId);
            if (!info.title) {
                throw new Error("What happened?");
            }

            return Markup.urlButton(info.title, await telegram.exportChatInviteLink(groupId));
        }));

        await reply("你现在可以进入以下的群：", Markup.inlineKeyboard([
            buttons
        ]).extra());
    }
}
