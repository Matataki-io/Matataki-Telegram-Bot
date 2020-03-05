import { Group } from "#/entities";

export interface IFandomGroupRequirementRepository {
    removeAll(group: Group): Promise<void>
}
