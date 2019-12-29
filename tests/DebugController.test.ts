import "reflect-metadata";

import { Message } from "telegraf/typings/telegram-types";

import { DebugController } from "#/controllers/DebugController";
import { createMockedContext } from "./Utils";

const controller = new DebugController();

describe("DebugController", () => {
    it("Ping", async () => {
        const ctx = createMockedContext()

        await controller.ping(ctx);

        expect(ctx.reply).toBeCalledTimes(1);
        expect(ctx.reply).toBeCalledWith("pong");
    });
});
