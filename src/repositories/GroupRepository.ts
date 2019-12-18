import { Repository } from "../decorators";
import { Group } from "../entities";
import { IGroupRepository } from "../definitions";
import { BaseRepository } from ".";

@Repository(Group)
export class GroupRepository extends BaseRepository<Group> implements IGroupRepository {
    constructor() {
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

        await this.repository.save(group);
        return true;
    }

}
