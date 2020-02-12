import { User } from "#/entities";
import { IUserRepository } from "#/repositories";

export class UserRepositoryStub implements IUserRepository {
    private users: User[];

    constructor() {
        this.users = [
            {
                id: 1,
                groups: [],
                username: "user1",
            },
            {
                id: 2,
                groups: [],
                username: "user2",
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
            groups: [],
            username: "user" + id,
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

    setUsername(id: number, username: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getIdByUsername(username: string): Promise<number | null> {
        throw new Error("Method not implemented.");
    }
}
