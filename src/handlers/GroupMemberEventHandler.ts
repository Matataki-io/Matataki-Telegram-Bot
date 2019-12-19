import { injectable } from "inversify";
import { Telegram } from "telegraf";

import { InjectRepository } from "../decorators";
import { Group } from "../entities";
import { IGroupRepository } from "../definitions";

@injectable()
export class GroupMemberEventHandler {
    constructor(@InjectRepository(Group) private repo: IGroupRepository) {

    }

    async onBotJoinGroup(groupId: number, inviter: number, telegram: Telegram) {
        const administrators = await telegram.getChatAdministrators(groupId);
        const creator = administrators.find(admin => admin.status === "creator");
        if (!creator) {
            throw new Error("Impossible situation");
        }

        const creatorId = creator.user.id;
        if (inviter !== creatorId) {
            console.info("不是群主邀请入群，立即退出");
            await telegram.leaveChat(groupId);
            return;
        }

        await this.repo.addOrSetActiveGroup(groupId, creator.user.id);
    }
    async onBotLeaveGroup(groupId: number) {
        return this.repo.setActive(groupId, false);
    }

    onNewMembers(groupId: number, memberIds: number[]) {
        return this.repo.addMembers(groupId, memberIds);
    }

    async onMemberQuit(groupId: number, memberId: number) {
        return this.repo.removeMember(groupId, memberId);
    }
}
