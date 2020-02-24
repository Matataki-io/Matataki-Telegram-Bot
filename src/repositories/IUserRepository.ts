import { User } from "#/entities";

export interface IUserRepository {
    ensureUser(id: number, username?: string): Promise<User>;
    getUser(id: number, ignoreGroup?: boolean): Promise<User | undefined>;
    setUsername(id: number, username: string): Promise<void>;
    getIdByUsername(username: string): Promise<number | null>;
    setUserLanguage(user: User, language: string): Promise<void>;
}
