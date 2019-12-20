import { Repository, InjectRepository } from "../decorators";
import { Group, User } from "../entities";
import { IGroupRepository, IUserRepository } from "../definitions";
import { BaseRepository } from "./BaseRepository";

@Repository(Group)
export class GroupRepository extends BaseRepository<Group> implements IGroupRepository {
    constructor(@InjectRepository(User) private userRepo: IUserRepository) {
        super(Group);
    }

    async addOrSetActiveGroup(id: number, creatorId: number) {
        let group = await this.repository.findOne(id);
        if (!group) {
            group = this.repository.create();
            group.id = id;
            group.creatorId = creatorId;
        }

        group.active = true;

        await this.repository.save(group);
    }

    getGroup(id: number) {
        return this.repository.findOneOrFail(id, { relations: ["members", "requirements"] });
    }
    getGroupsOfCreator(creatorId: number) {
        return this.repository.find({ creatorId });
    }

    getGroups() {
        return this.repository.find({ relations: ["members", "requirements"] });
    }

    async addMembers(id: number, memberIds: number[]) {
        const group = await this.getGroup(id);

        for (const memberId of memberIds) {
            if (!group.members.find(user => Number(user.id) === memberId)) {
                continue;
            }

            const user = await this.userRepo.addUser(memberId);

            group.members.push(user);
        }

        await this.repository.save(group);
    }
    async removeMember(id: number, memberId: number) {
        const group = await this.getGroup(id);
        const index = group.members.findIndex(user => user.id === memberId);

        if (index === -1) {
            console.error(`There's no a user ${memberId} in group ${id}`);
            return;
        }

        group.members.splice(index, 1);

        await this.repository.save(group);
    }

    async setActive(id: number, active: boolean) {
        const group = await this.getGroup(id);
        group.active = active;

        await this.repository.save(group);
    }
}
