import { User } from "#/entities";
import { IUserRepository } from "#/repositories";

export class UserRepositoryStub implements IUserRepository {
    private users: User[];

    constructor() {
        this.users = [
            {
                id: 1,
                groups: [],
            },
            {
                id: 2,
                groups: [],
            }
        ];
    }

    ensureUser(id: number): Promise<User> {
        for (const user of this.users) {
            if (user.id === id) {
                return Promise.resolve(user);
            }
        }

        const result = {
            id,
            groups: []
        };
        this.users.push(result);

        return Promise.resolve(result);
    }

    getUser(id: number): Promise<User | undefined> {
        for (const user of this.users) {
            if (user.id === id) {
                return Promise.resolve(user);
            }
        }

        return Promise.resolve(undefined);
    }
}
