import { injectable } from "inversify";
import { Telegram } from "telegraf";

import { InjectRepository } from "../decorators";
import { Group } from "../entities";
import { GroupRepository } from "../repositories";

@injectable()
export class JoinGroupHandler {

    constructor(@InjectRepository(Group) private repo: GroupRepository) {

    }

    async process(groupId: number, inviter: number, telegram: Telegram) {
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

        await this.repo.addGroup(groupId, creator.user.id);
    }
}
