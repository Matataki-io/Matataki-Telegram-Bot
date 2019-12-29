import "reflect-metadata";

import { Message } from "telegraf/typings/telegram-types";

import { DebugController } from "#/controllers/DebugController";
import { MessageHandlerContext } from "#/definitions";

const controller = new DebugController();

describe("DebugController", () => {
    it("Ping", () => {
        const replyFunc = jest.fn(message => {
            return Promise.resolve<Message>({} as Message);
        });

        //@ts-ignore
        controller.ping({
            reply: replyFunc,
        } as jest.Mocked<MessageHandlerContext>);

        expect(replyFunc).toBeCalledTimes(1);
        expect(replyFunc).toBeCalledWith("pong");
    });
});
