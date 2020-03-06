import { getRepository } from "typeorm";

import { GroupController } from "#/controllers/GroupController";
import { Group } from "#/entities";

import { createMockedContext } from "../Utils";
import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";
import { GroupRepositoryStub } from "../stubs/repositories/GroupRepositoryStub";
import { MatatakiServiceStub } from "../stubs/services/MatatakiServiceStub";
import { BotServiceStub } from "../stubs/services/BotServiceStub";
import { FandomGroupRequirementRepositoryStub } from "../stubs/repositories/FandomGroupRequirementRepositoryStub";

const botService = new BotServiceStub();

function createController() {
    return new GroupController(new UserRepositoryStub(), new GroupRepositoryStub(), new FandomGroupRequirementRepositoryStub(), botService, null!, null!, new MatatakiServiceStub());
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
        ctx.telegram.getChatAdministrators.mockResolvedValue([
            {
                status: "creator",
                user: {
                    id: 8101,
                    is_bot: false,
                    first_name: "李田所",
                },
            },
        ]);

        const groupRepo = getRepository(Group);
        await expect(groupRepo.findOneOrFail(-191919)).rejects.toThrow();

        const controller = createController();
        await controller.onNewMemberEnter(ctx);

        await expect(groupRepo.findOneOrFail(-191919)).resolves.not.toBeNull();

        const group = await groupRepo.findOneOrFail(-191919);
        expect(group.title).toBe("下北沢讨论区2");
        expect(group.creatorId).toBe(8101);
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
        expect(group.members.find(m => Number(m.id) === 8102)).not.toBeUndefined();
        expect(group.members.find(m => Number(m.id) === 8102)).not.toBeUndefined();
    });
    test("When the user joins a group but no enough minetoken", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -114514,
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
        const group = await groupRepo.findOneOrFail(-114514, { relations: ["members"] });

        expect(group.members.find(m => Number(m.id) === 8000)).toBeUndefined();

        expect(ctx.telegram.kickChatMember).toBeCalledTimes(1);
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
                from: {
                    id: 8000,
                    is_bot: false,
                    first_name: "一般通过爷",
                },
                group_chat_created: true,
            },
        });

        const controller = createController();
        await controller.onGroupCreated(ctx);

        const groupRepo = getRepository(Group);

        expect(groupRepo.findOneOrFail(-1111)).resolves.not.toBeNull();
    });
    test("When the bot leaves a fandom group", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -114514,
                    title: "野兽邸",
                    type: "supergroup",
                },
                from: {
                    id: 123,
                    is_bot: true,
                    first_name: "Matataki Fan票机器人",
                    username: "matataki_bot",
                },
                left_chat_member: {
                    id: 123,
                    is_bot: true,
                    first_name: "Matataki Fan票机器人",
                    username: "matataki_bot",
                },
            },
        });

        const controller = createController();
        await controller.onMemberLeft(ctx);

        const groupRepo = getRepository(Group);

        const group = await groupRepo.findOneOrFail(-114514, { relations: ["requirements"] });

        expect(group.requirements).toHaveLength(0);
    });

    test("When the creator set new requirement", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    id: -114514,
                    title: "野兽邸",
                    type: "supergroup",
                },
                from: {
                    id: 8101,
                    is_bot: false,
                    first_name: "李田所",
                },
            },
        });
        ctx.telegram.getChatAdministrators.mockResolvedValue([
            {
                status: "creator",
                user: {
                    id: 8101,
                    is_bot: false,
                    first_name: "李田所",
                },
            },
            {
                status: "administrator",
                user: {
                    id: 123,
                    is_bot: true,
                    first_name: "Matataki Fan票机器人",
                },
                can_invite_users: true,
            },
        ]);

        const controller = createController();
        await controller.setGroupRequirement(ctx, null!, -114514, 19190000);

        const groupRepo = getRepository(Group);

        const group = await groupRepo.findOneOrFail(-114514, { relations: ["requirements"] });

        expect(group.requirements).toHaveLength(1);

        const requirement = group.requirements[0];
        expect(requirement.minetokenId).toBe(1919);
        expect(requirement.amount).toBe(19190000);
        expect(requirement.amountCanEqual).toBe(true);
    });
});
