import { getRepository } from "typeorm";

import { User } from "#/entities";

import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";

describe("UserRepository", () => {
    it("ensureUser", async () => {
        const repo = getRepository(User);

        let user = await repo.findOne(-1);
        expect(user).toBeUndefined();

        const stub = new UserRepositoryStub();
        await stub.ensureUser(-1, "newuser");

        user = await repo.findOne(-1);
        expect(user).not.toBeUndefined();
        expect(user!.id).toBe(-1);
        expect(user!.username).toBe("newuser");
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
        it("Exists", async () => {
            const stub = new UserRepositoryStub();
            const id = await stub.getIdByUsername("newusername");

            expect(id).toBeNull();
        });
    })
});
