import { Repository } from "../decorators";
import { Group, User } from "../entities";
import { IGroupRepository } from "../definitions";
import { BaseRepository } from "./BaseRepository";

@Repository(Group)
export class GroupRepository extends BaseRepository<Group> implements IGroupRepository {
    static relationsOption = { relations: ["members"] };

    constructor() {
        super(Group);
    }

    async ensureGroup(id: number, creatorId: number, tokenId: number) {
        let group = await this.repository.findOne(id);
        if (!group) {
            group = this.repository.create();
            group.id = id;
            group.creatorId = creatorId;
            group.tokenId = tokenId;
            group.requirement = {};
        }

        group.active = true;

        await this.repository.save(group);

        return group;
    }

    getGroup(id: number) {
        return this.repository.findOneOrFail(id, { where: { active: true }, ...GroupRepository.relationsOption });
    }
    getGroupsOfCreator(creatorId: number) {
        return this.repository.find({ where: { creatorId, active: true }, ...GroupRepository.relationsOption });
    }

    getGroups() {
        return this.repository.find({ where: { active: true }, ...GroupRepository.relationsOption });
    }

    async addMembers(group: Group, members: User[]) {
        const maps = new Map<number, User>(members.map(user => [Number(user.id), user]));

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
    removeMembers(group: Group, members: User[]) {
        group.members = group.members.filter(user => !members.includes(user));

        return this.repository.save(group);
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

        await this.repository.save(group);
    }

    async changeGroupId(group: Group, newId: number) {
        const oldId = Number(group.id);
        group.id = newId;

        await this.repository.save(group);
        await this.repository.delete(oldId);
    }
}
