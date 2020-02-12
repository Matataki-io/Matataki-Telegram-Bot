import "reflect-metadata";

import { Message } from "telegraf/typings/telegram-types";

import { DebugController } from "#/controllers/DebugController";
import { createMockedContext } from "./Utils";

const controller = new DebugController();

describe("DebugController", () => {
    it("/ping", async () => {
        const ctx = createMockedContext();

        await controller.ping(ctx);

        expect(ctx.reply).toBeCalledTimes(1);
        expect(ctx.reply).toBeCalledWith("pong");
    });

    describe("/debuggrouponly", () => {
        it("Group Chat (Group)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "group",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
        it("Group Chat (Supergroup)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "supergroup",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
        it("Private Chat", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                },
            });

            await controller.groupOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限群聊里使用");
        });
    });

    describe("/debugprivatechatonly", () => {
        it("Group Chat (Group)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "group",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限和机器人私聊里使用");
        });
        it("Group Chat (Supergroup)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "supergroup",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("该命令仅限和机器人私聊里使用");
        });
        it("Private Chat", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                },
            });

            await controller.privateChatOnly(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Ok");
        });
    });
});
