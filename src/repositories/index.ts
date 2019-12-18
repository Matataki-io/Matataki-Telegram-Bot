export * from "./BaseRepository";

import { UserRepository } from "./UserRepository";
import { GroupRepository } from "./GroupRepository";

export {
    UserRepository,
    GroupRepository,
}

export const repositories = [
    UserRepository,
    GroupRepository,
];
