import { table } from "table";

import { Controller, Command, InjectRepository } from "../decorators";
import { MessageHandlerContext, IGroupRepository } from "../definitions";
import { BaseController } from "./BaseController";
import { Group, GroupRequirement } from "../entities";
import { GroupRequirementRepository } from "../repositories";

@Controller("group")
export class GroupController extends BaseController<GroupController> {
    constructor(@InjectRepository(Group) private groupRepo: IGroupRepository, @InjectRepository(GroupRequirement) private requirementRepo: GroupRequirementRepository) {
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

        if (!groups.find(group => Number(group.id) === groupId)) {
            await reply(`没有找到符合以下所有条件的群：
            - 群主是你
            - 机器人是群成员`);
            return;
        }

        await this.requirementRepo.setRequiredAmount(groupId, amount);

        await reply("OK");
        return true;
    }
}
