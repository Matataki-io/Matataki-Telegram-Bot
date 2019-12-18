export interface IUserRepository {
    addUser(id: number): Promise<void>;
}

export interface IGroupRepository {
    addGroup(id: number, creatorId: number): Promise<boolean>;
}
