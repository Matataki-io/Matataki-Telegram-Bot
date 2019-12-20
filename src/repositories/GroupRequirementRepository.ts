import { Repository, InjectRepository } from "../decorators";
import { GroupRequirement, Group } from "../entities";
import { IGroupRequirementRepository, IGroupRepository } from "../definitions";
import { BaseRepository } from "./BaseRepository";
import { Tokens } from "../constants";

@Repository(GroupRequirement)
export class GroupRequirementRepository extends BaseRepository<GroupRequirement> implements IGroupRequirementRepository {
    constructor(@InjectRepository(Group) private groupRepo: IGroupRepository) {
        super(GroupRequirement);
    }

    async setRequiredAmount(groupId: number, amount: number) {
        let requirement = await this.repository.findOne({ where: { groupId }, relations: ["group"] });
        if (!requirement) {
            const group = await this.groupRepo.getGroup(groupId);

            requirement = new GroupRequirement();
            requirement.group = group;
            requirement.token = Tokens.Eth;
        }

        requirement.amount = amount;

        await this.repository.save(requirement);
    }
}
