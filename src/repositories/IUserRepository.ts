import { User } from "#/entities";

export interface IUserRepository {
    ensureUser(id: number): Promise<User>;
    getUser(id: number): Promise<User | undefined>;
}
