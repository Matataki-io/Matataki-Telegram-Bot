import { SyncController } from "#/controllers/SyncController";
import { createMockedContext } from "./Utils";
import { UserRepositoryStub } from "./stubs/repositories/UserRepositoryStub";
import { User } from "#/entities";
import { getRepository } from "typeorm";

function createController() {
    return new SyncController(new UserRepositoryStub());
}

describe("SyncController", () => {
    describe("/syncusername", () => {
        it("Sync username from old user", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 1,
                        username: "thefirstuser",
                    },
                },
            });

            const controller = createController();

            const userRepo = getRepository(User);
            let user = await userRepo.findOneOrFail(1);

            expect(user.username).toBeNull();

            await controller.syncUsername(ctx);

            user = await userRepo.findOneOrFail(1);
            expect(user.username).toBe("thefirstuser");

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok", {});
        });
        it("Failed to sync username from old user", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 1,
                    },
                },
            });

            const controller = createController();

            const userRepo = getRepository(User);
            let user = await userRepo.findOneOrFail(1);

            expect(user.username).toBeNull();

            await controller.syncUsername(ctx);

            user = await userRepo.findOneOrFail(1);
            expect(user.username).toBeNull();

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("抱歉，您还没有设置 Telegram 帐号用户名", {});
        });
    });
});
