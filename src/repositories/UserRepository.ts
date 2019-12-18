import { Repository } from "../decorators";
import { User } from "../entities";
import { IUserRepository } from "../definitions";
import { BaseRepository } from ".";

@Repository(User)
export class UserRepository extends BaseRepository<User> implements IUserRepository {
    constructor() {
        super(User);
    }

    async addUser(id: number): Promise<void> {
    }

}
