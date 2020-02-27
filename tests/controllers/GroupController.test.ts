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
    test("When the bot joins a group", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -191919,
                    title: "下北沢讨论区2",
                    type: "supergroup",
                },
                new_chat_members: [{
                    id: 123,
                    is_bot: true,
                    first_name: "Bot",
                }],
            },
        });

        const groupRepo = getRepository(Group);
        await expect(groupRepo.findOneOrFail(-191919)).rejects.toThrow();

        const controller = createController();
        await controller.onNewMemberEnter(ctx);

        await expect(groupRepo.findOneOrFail(-191919)).resolves.not.toBeNull();
    });
    test("When the user joins a group", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -1919,
                    type: "supergroup",
                },
                new_chat_members: [{
                    id: 8000,
                    is_bot: false,
                    first_name: "一般通过爷",
                }],
            },
        });

        const controller = createController();
        await controller.onNewMemberEnter(ctx);

        const groupRepo = getRepository(Group);
        const group = await groupRepo.findOneOrFail(-1919, { relations: ["members"] });

        expect(group.members.find(m => Number(m.id) === 8000)).not.toBeUndefined();
    });
    test("When a user creates a group with bot invited", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -1111,
                    title: "新群",
                    type: "group",
                },
                from: [{
                    id: 8000,
                    is_bot: false,
                    first_name: "一般通过爷",
                }],
                group_chat_created: true,
            },
        });

        const controller = createController();
        await controller.onGroupCreated(ctx);

        const groupRepo = getRepository(Group);

        expect(groupRepo.findOneOrFail(-1111)).resolves.not.toBeNull();
    });
});
