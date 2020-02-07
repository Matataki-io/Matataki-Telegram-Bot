import { User } from "#/entities";

export interface IUserRepository {
    ensureUser(id: number, username?: string): Promise<User>;
    getUser(id: number): Promise<User | undefined>;
    getIdByUsername(username: string): Promise<number | null>;
}
