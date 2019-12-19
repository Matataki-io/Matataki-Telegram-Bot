import { Group, User } from "../entities";

export interface IUserRepository {
    addUser(id: number): Promise<User>;
}

export interface IGroupRepository {
    addGroup(id: number, creatorId: number): Promise<boolean>;

    getGroupsOfCreator(creatorId: number): Promise<Group[]>;

    addMembers(id: number, memberIds: number[]): Promise<any>;
}
