import { getRepository } from "typeorm";

import { GroupController } from "#/controllers/GroupController";
import { Group } from "#/entities";

import { createMockedContext } from "../Utils";
import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";
import { GroupRepositoryStub } from "../stubs/repositories/GroupRepositoryStub";
import { MatatakiServiceStub } from "../stubs/services/MatatakiServiceStub";
import { BotServiceStub } from "../stubs/services/BotServiceStub";

const botService = new BotServiceStub();

function createController() {
    return new GroupController(new UserRepositoryStub(), new GroupRepositoryStub(), botService, null!, null!, new MatatakiServiceStub());
}

describe("GroupController", () => {
    it("When bot leaves a actived group", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -114514,
                    type: "supergroup",
                },
                left_chat_member: botService.info,
            },
        });

        const controller = createController();
        await controller.onMemberLeft(ctx);

        const groupRepo = getRepository(Group);
        const group = await groupRepo.findOneOrFail(-114514);

        expect(group.active).toBeFalsy();
    });
    it("When the creator leaves one of his/her groups", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -114514,
                    type: "supergroup",
                },
                left_chat_member: {
                    id: 8101,
                },
            },
        });

        const controller = createController();
        await controller.onMemberLeft(ctx);

        const groupRepo = getRepository(Group);
        const group = await groupRepo.findOneOrFail(-114514);

        expect(group.active).toBeFalsy();
    });
});
