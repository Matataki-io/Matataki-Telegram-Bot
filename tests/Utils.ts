jest.mock("telegraf");

import Telegraf from "telegraf";

import { MessageHandlerContext } from "#/definitions";

function createMockedAsyncFunction() {
    return jest.fn(() => Promise.resolve());
}

export function createMockedContext(): MessageHandlerContext {
    // @ts-ignore
    const result = new Telegraf.Context();

    Object.assign(result, {
        message: {
            chat: {
                id: 1234567890,
            },
        },
        telegram: {
            sendMessage: createMockedAsyncFunction(),
        },
    });

    return result as MessageHandlerContext;
};
