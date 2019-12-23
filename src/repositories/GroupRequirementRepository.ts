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

    async setRequiredAmount(group: Group, amount: number) {
        let requirement = group.requirements.find(req => req.token === Tokens.Eth);
        if (!requirement) {
            requirement = new GroupRequirement();
            requirement.group = group;
            requirement.token = Tokens.Eth;
        }

        requirement.amount = amount;

        await this.repository.save(requirement);
    }
}
