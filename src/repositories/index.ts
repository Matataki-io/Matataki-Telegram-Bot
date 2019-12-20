export * from "./BaseRepository";

import { UserRepository } from "./UserRepository";
import { GroupRepository } from "./GroupRepository";
import { GroupRequirementRepository } from "./GroupRequirementRepository";

export {
    UserRepository,
    GroupRepository,
    GroupRequirementRepository,
}

export const repositories = [
    UserRepository,
    GroupRepository,
    GroupRequirementRepository,
];
