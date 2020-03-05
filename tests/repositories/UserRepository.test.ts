import { getRepository } from "typeorm";

import { User } from "#/entities";

import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";

describe("UserRepository", () => {
    it("ensureUser", async () => {
        const repo = getRepository(User);

        const telegramUser = {
            id: -1,
            username: "newuser",
            is_bot: false,
            first_name: "New",
        };

        let user = await repo.findOne(telegramUser.id);
        expect(user).toBeUndefined();

        const stub = new UserRepositoryStub();
        await stub.ensureUser(telegramUser);

        user = await repo.findOne(telegramUser.id);
        expect(user).not.toBeUndefined();
        expect(Number(user!.id)).toBe(telegramUser.id);
        expect(user!.username).toBe(telegramUser.username);
    });
    it("setUsername", async () => {
        const repo = getRepository(User);

        let user = await repo.findOne(1);
        expect(user).not.toBeUndefined();

        const stub = new UserRepositoryStub();
        await stub.setUsername(1, "newusername");

        user = await repo.findOne(1);
        expect(user!.username).toBe("newusername");
    });
    describe("getIdByUsername", () => {
        it("Exists", async () => {
            const stub = new UserRepositoryStub();
            const id = await stub.getIdByUsername("theseconduser");

            expect(id).toBe(2);
        });
        it("Not exist", async () => {
            const stub = new UserRepositoryStub();
            const id = await stub.getIdByUsername("newusername");

            expect(id).toBeNull();
        });
    });
});
