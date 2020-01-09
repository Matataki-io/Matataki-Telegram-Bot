import { Not } from "typeorm";

import { Repository } from "#/decorators";
import { Group, User } from "#/entities";
import { BaseRepository, IGroupRepository } from "#/repositories";

const relationsOption = { relations: ["members"] };

@Repository(Group)
export class GroupRepositoryImpl extends BaseRepository<Group> implements IGroupRepository {

    constructor() {
        super(Group);
    }

    async ensureGroup(id: number, title: string, creatorId: number, tokenId: number) {
        let group = await this.repository.findOne(id);
        if (!group) {
            group = this.repository.create();
            group.id = id;
            group.title = title;
            group.creatorId = creatorId;
            group.tokenId = tokenId;
            group.requirement = {};
        }

        await this.repository.save(group);

        return group;
    }

    getGroup(id: number) {
        return this.repository.findOneOrFail(id, { where: { active: true }, ...relationsOption });
    }
    getGroupOrDefault(id: number) {
        return this.repository.findOne(id, { where: { active: true }, ...relationsOption }) ?? null;
    }
    getGroupsOfCreator(creatorId: number) {
        return this.repository.find({ where: { creatorId, active: true }, ...relationsOption });
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
        group.active = active;

        await this.repository.save(group);
    }

    async setRequirement(group: Group, tokenAmount: number) {
        group.requirement = {
            minetoken: {
                amount: tokenAmount,
                canEqual: true,
            },
        }
        group.active = true;

        await this.repository.save(group);
    }

    async changeGroupId(group: Group, newId: number) {
        const oldId = Number(group.id);
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
}
