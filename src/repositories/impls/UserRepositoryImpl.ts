import { User as TelegramUser } from "telegraf/typings/telegram-types";

import { Repository } from "#/decorators";
import { User } from "#/entities";
import { BaseRepository, IUserRepository } from "#/repositories";

@Repository(User)
export class UserRepositoryImpl extends BaseRepository<User> implements IUserRepository {
    constructor() {
        super(User);
    }

    async ensureUser(telegramUser: TelegramUser): Promise<User> {
        if (telegramUser.is_bot) {
            throw new Error("Expect a non-bot telegram user");
        }

        let user = await this.repository.findOne(telegramUser.id);
        if (!user) {
            user = await this.repository.save(this.repository.create({
                id: telegramUser.id,
                username: telegramUser.username,
                language: telegramUser.language_code,
            }));
        }

        return user;
    }

    getUser(id: number, ignoreGroup?: boolean) {
        if (ignoreGroup) {
            return this.repository.findOne(id);
        }

        return this.repository.createQueryBuilder("user").innerJoinAndSelect("user.groups", "group", "group.active").where("user.id = :id", { id }).getOne();
    }

    async setUsername(id: number, username: string): Promise<void> {
        await this.repository.update(id, { username });
    }
    async getIdByUsername(username: string): Promise<number | null> {
        const user = await this.repository.findOne({ where: { username }});
        if (!user) {
            return null;
        }

        return Number(user.id);
    }

    async setUserLanguage(user: User, language: string) {
        await this.repository.update(user.id, { language });
    }
}
