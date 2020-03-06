import { Group } from "#/entities";

export interface IFandomGroupRequirementRepository {
    set(group: Group, minetokenId: number, amount: number): Promise<void>
    removeAll(group: Group): Promise<void>
}
