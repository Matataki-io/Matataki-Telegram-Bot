export interface IUserRepository {
    addUser(id: number): Promise<void>;
}
