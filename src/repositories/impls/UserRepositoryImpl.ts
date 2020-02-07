import { Repository } from "#/decorators";
import { User } from "#/entities";
import { BaseRepository, IUserRepository } from "#/repositories";

@Repository(User)
export class UserRepositoryImpl extends BaseRepository<User> implements IUserRepository {
    constructor() {
        super(User);
    }

    async ensureUser(id: number, username?: string) {
        let user = await this.repository.findOne(id);
        if (user) {
            return user;
        }

        user = this.repository.create();
        user.id = id.toString();
        user.username = username ?? null;

        await this.repository.save(user);

        return user;
    }

    getUser(id: number) {
        return this.repository.createQueryBuilder("user").innerJoinAndSelect("user.groups", "group", "group.active").where("user.id = :id", { id }).getOne();
    }

    async setUsername(id: number, username: string): Promise<void> {
        const user = await this.ensureUser(id);

        user.username = username;

        await this.repository.save(user);
    }
    async getIdByUsername(username: string): Promise<number | null> {
        const user = await this.repository.findOne({ where: { username }});
        if (!user) {
            return null;
        }

        return Number(user.id);
    }
}
