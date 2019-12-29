import { Repository } from "#/decorators";
import { User } from "#/entities";
import { BaseRepository, IUserRepository } from "#/repositories";

@Repository(User)
export class UserRepositoryImpl extends BaseRepository<User> implements IUserRepository {
    constructor() {
        super(User);
    }

    async ensureUser(id: number) {
        let user = await this.repository.findOne(id);
        if (user) {
            return user;
        }

        user = this.repository.create();
        user.id = id;

        await this.repository.save(user);

        return user;
    }

    getUser(id: number) {
        return this.repository.findOne(id, { relations: ["groups"] });
    }
}
