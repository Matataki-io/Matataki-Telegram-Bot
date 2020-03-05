import { Not } from "typeorm";

import { Repository } from "#/decorators";
import { Chat } from "telegraf/typings/telegram-types";

import { Group, User } from "#/entities";
import { BaseRepository, IGroupRepository } from "#/repositories";

const relationsOption = { relations: ["members", "requirements"] };

@Repository(Group)
export class GroupRepositoryImpl extends BaseRepository<Group> implements IGroupRepository {
    constructor() {
        super(Group);
    }

    async ensureGroup(telegramChat: Chat, creatorId: number) {
        if (telegramChat.type !== "group" && telegramChat.type !== "supergroup") {
            throw new Error("Expect a chat of type 'group'");
        }

        let group = await this.repository.findOne(telegramChat.id);
        if (!group) {
            group = this.repository.create({
                id: telegramChat.id,
                title: telegramChat.title,
                creatorId,
            });

            debugger;
            await this.repository.save(group);
        }

        return group;
    }

    getGroup(id: number) {
        return this.repository.findOneOrFail(id, relationsOption);
    }
    getGroupOrDefault(id: number, includeInactive?: boolean) {
        return this.repository.findOne(id, relationsOption);
    }

    getGroups() {
        return this.repository.find({ where: { active: true }, ...relationsOption });
    }
    getGroupsExceptMyToken(tokenId?: number) {
        if (!tokenId) {
            return this.getGroups();
        }

        return this.repository.find({ where: { active: true, tokenId: Not(tokenId) }, ...relationsOption });
    }

    async addMembers(group: Group, members: User[]) {
        const maps = new Map<number, User>(group.members.map(user => [Number(user.id), user]));

        for (const member of members) {
            const id = Number(member.id);

            if (maps.has(id)) {
                continue;
            }

            maps.set(id, member);
        }

        group.members = Array.from(maps.values());

        await this.repository.save(group);
    }
    async removeMember(group: Group, member: User) {
        const index = group.members.findIndex(user => user === member);

        if (index === -1) {
            console.error(`There's no a user ${member.id} in group ${group.id}`);
            return;
        }

        group.members.splice(index, 1);

        await this.repository.save(group);
    }
    async removeMembers(group: Group, members: User[]) {
        group.members = group.members.filter(user => !members.includes(user));

        await this.repository.save(group);
    }

    async setActive(group: Group, active: boolean) {
    }

    async setRequirement(group: Group, tokenAmount: number) {
    }

    async changeGroupId(oldId: number, newId: number) {
        const group = await this.repository.findOneOrFail(oldId, relationsOption);
        group.id = newId;

        await this.repository.save(group);
        await this.repository.delete(oldId);
    }

    async changeGroupTitle(group: Group, newTitle: string) {
        group.title = newTitle;

        await this.repository.save(group);
    }

    async removeGroup(group: Group) {
        await this.repository.delete(group);
    }

    getJoinedGroups(id: number) {
        return this.repository.createQueryBuilder("group")
            .leftJoinAndSelect("group.requirements", "requirement")
            .innerJoin("group.members", "member")
            .where("member.id = :id", { id })
            .getMany();
    }
    getGroupsOfCreator(creatorId: number) {
        return this.repository.find({ where: { creatorId }, ...relationsOption });
    }
}
