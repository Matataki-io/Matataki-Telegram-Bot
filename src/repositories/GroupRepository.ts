import { Repository, InjectRepository } from "../decorators";
import { Group, User } from "../entities";
import { IGroupRepository, IUserRepository } from "../definitions";
import { BaseRepository } from ".";

@Repository(Group)
export class GroupRepository extends BaseRepository<Group> implements IGroupRepository {
    constructor(@InjectRepository(User) private userRepo: IUserRepository) {
        super(Group);
    }

    async addGroup(id: number, creatorId: number): Promise<boolean> {
        let group = await this.repository.findOne(id);
        if (group) {
            return false;
        }

        group = this.repository.create();
        group.id = id;
        group.creatorId = creatorId;
        group.active = true;

        await this.repository.save(group);
        return true;
    }

    getGroupsOfCreator(creatorId: number): Promise<Group[]> {
        return this.repository.find({ creatorId });
    }

    async addMembers(id: number, memberIds: number[]): Promise<any> {
        const group = await this.repository.findOne(id, { relations: ["members"] });
        if (!group) {
            throw new Error("What happended");
        }

        for (const memberId of memberIds) {
            const user = await this.userRepo.addUser(memberId);

            group.members.push(user);
        }

        await this.repository.save(group);
    }

    async setActive(id: number, active: boolean) {
        const group = await this.getGroup(id);
        group.active = active;

        await this.repository.save(group);
    }
}
