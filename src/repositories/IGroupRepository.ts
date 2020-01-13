import { Group, User } from "#/entities";

export interface IGroupRepository {
    ensureGroup(id: number, title: string, creatorId: number, tokenId: number): Promise<Group>;
    getGroup(id: number): Promise<Group>;
    getGroupOrDefault(id: number): Promise<Group | undefined>;
    getGroupsOfCreator(creatorId: number): Promise<Group[]>;
    getGroups(): Promise<Group[]>;
    getGroupsExceptMyToken(tokenId?: number): Promise<Group[]>;
    addMembers(group: Group, members: User[]): Promise<void>;
    removeMember(group: Group, member: User): Promise<void>;
    removeMembers(group: Group, members: User[]): Promise<void>;
    setActive(group: Group, active: boolean): Promise<void>;
    setRequirement(group: Group, tokenAmount: number): Promise<void>;
    changeGroupId(oldId: number, newId: number): Promise<void>;
    changeGroupTitle(group: Group, newTitle: string): Promise<void>;
    removeGroup(group: Group): Promise<void>;
}
