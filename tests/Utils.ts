jest.mock("telegraf");

import Telegraf from "telegraf";
import { Container } from "inversify";

import { MessageHandlerContext } from "#/definitions";
import { MetadataKeys, Injections } from "#/constants";
import { MatatakiServiceStub } from "./stubs/services/MatatakiServiceStub";

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

    Reflect.defineMetadata(MetadataKeys.Context, {
        ctx: result,
        container: createContainer(),
    }, result);

    return result as MessageHandlerContext;
};

function createContainer() {
    const result = new Container({ skipBaseClassChecks: true });

    result.bind(Injections.MatatakiService).toDynamicValue(() => new MatatakiServiceStub()).inSingletonScope();

    return result;
}
