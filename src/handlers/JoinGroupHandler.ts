import { injectable } from "inversify";
import { ContextMessageUpdate } from "telegraf";

import { InjectRepository } from "../decorators";
import { Group } from "../entities";
import { GroupRepository } from "../repositories";

@injectable()
export class JoinGroupHandler {

    constructor(@InjectRepository(Group) private repo: GroupRepository) {

    }

    async process(groupId: number, ctx: ContextMessageUpdate) {
        const administrators = await ctx.telegram.getChatAdministrators(groupId);
        const creator = administrators.find(admin => admin.status === "creator");
        if (!creator) {
            throw new Error("Impossible situation");
        }

        const a = await this.repo.addGroup(groupId, creator.user.id);
    }
}
