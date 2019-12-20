import { Group, User } from "../entities";

export interface IUserRepository {
    addUser(id: number): Promise<User>;
}

export interface IGroupRepository {
    addOrSetActiveGroup(id: number, creatorId: number): Promise<void>;

    getGroup(id: number): Promise<Group>;
    getGroupsOfCreator(creatorId: number): Promise<Group[]>;

    getGroups(): Promise<Group[]>;

    addMembers(id: number, memberIds: number[]): Promise<void>;
    removeMember(id: number, memberId: number): Promise<void>;

    setActive(id: number, active: boolean): Promise<void>;
}

export interface IGroupRequirementRepository {
    setRequiredAmount(groupId: number, amount: number): Promise<void>;
}
