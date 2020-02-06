import { User } from "#/entities";

export interface IUserRepository {
    ensureUser(id: number): Promise<User>;
    getUser(id: number): Promise<User | undefined>;
    setUsername(id: number, username: string): Promise<void>;
    getIdByUsername(username: string): Promise<number | null>;
}
