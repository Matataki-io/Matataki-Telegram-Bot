import { Repository } from "#/decorators";
import { FandomGroupRequirement, Group } from "#/entities";
import { BaseRepository, IFandomGroupRequirementRepository } from "#/repositories";

@Repository(FandomGroupRequirement)
export class FandomGroupRequirementRepositoryImpl extends BaseRepository<FandomGroupRequirement> implements IFandomGroupRequirementRepository {
    constructor() {
        super(FandomGroupRequirement);
    }

    async set(group: Group, minetokenId: number, amount: number) {
        let requirement = group.requirements.find(r => r.minetokenId === minetokenId);
        if (!requirement) {
            requirement = this.repository.create({
                group,
                minetokenId,
                amountCanEqual: true,
            });

            group.requirements.push(requirement);
        }

        requirement.amount = amount;

        await this.repository.save(requirement);
    }

    async removeAll(group: Group) {
        await this.repository.delete({ group });
    }
}
