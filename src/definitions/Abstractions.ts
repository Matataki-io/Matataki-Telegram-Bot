import { Group, User } from "../entities";

export interface IUserRepository {
    ensureUser(id: number): Promise<User>;
    getUser(id: number): Promise<User | undefined>;
}

export interface IGroupRepository {
    ensureGroup(id: number, creatorId: number, tokenId: number): Promise<Group>;

    getGroup(id: number): Promise<Group>;
    getGroupsOfCreator(creatorId: number): Promise<Group[]>;

    getGroups(): Promise<Group[]>;
    getGroupsExceptMyToken(tokenId?: number): Promise<Group[]>;

    addMembers(group: Group, members: User[]): Promise<void>;
    removeMember(group: Group, member: User): Promise<void>;

    setActive(group: Group, active: boolean): Promise<void>;

    setRequirement(group: Group, tokenAmount: number): Promise<void>;

    changeGroupId(group: Group, newId: number): Promise<void>;
}
