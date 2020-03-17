import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { User } from "#/entities";

export interface IUserRepository {
    ensureUser(telegramUser: TelegramUser): Promise<User>;
    getUser(id: number, ignoreGroup?: boolean): Promise<User | undefined>;
    setUsername(id: number, username: string): Promise<void>;
    getIdByUsername(username: string): Promise<number | null>;
    setUserLanguage(user: User, language: string): Promise<void>;
}
