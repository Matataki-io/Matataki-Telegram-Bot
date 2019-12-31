jest.mock("telegraf");

import Telegraf from "telegraf";

import { MessageHandlerContext } from "#/definitions";

export function createMockedContext(): jest.Mocked<MessageHandlerContext> {
    // @ts-ignore
    return new Telegraf.Context() as MessageHandlerContext;
};
