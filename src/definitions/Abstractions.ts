import { Group, User } from "../entities";

export interface IUserRepository {
    ensureUser(id: number): Promise<User>;
    getUser(id: number): Promise<User | undefined>;
}

export interface IGroupRepository {
    ensureGroup(id: number, creatorId: number, tokenId: number): Promise<void>;

    getGroup(id: number): Promise<Group>;
    getGroupsOfCreator(creatorId: number): Promise<Group[]>;

    getGroups(): Promise<Group[]>;

    addMembers(group: Group, members: User[]): Promise<void>;
    removeMember(group: Group, member: User): Promise<void>;

    setActive(group: Group, active: boolean): Promise<void>;
}
