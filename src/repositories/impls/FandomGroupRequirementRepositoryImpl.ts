import { Repository } from "#/decorators";
import { FandomGroupRequirement, Group } from "#/entities";
import { BaseRepository, IFandomGroupRequirementRepository } from "#/repositories";

@Repository(FandomGroupRequirement)
export class FandomGroupRequirementRepositoryImpl extends BaseRepository<FandomGroupRequirement> implements IFandomGroupRequirementRepository {
    constructor() {
        super(FandomGroupRequirement);
    }

    async removeAll(group: Group) {
        await this.repository.delete({ group });
    }
}
