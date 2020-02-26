import "reflect-metadata";

import { TelegrafConstructor, ContextMessageUpdate } from "telegraf";
import { Container } from "inversify";

import { Command, Controller } from "#/decorators";
import { ControllerConstructor, BaseController } from "#/controllers";
import { MiddlewareServiceImpl } from "#/services/impls/MiddlewareServiceImpl";

function createBotInstance(controllers: Array<ControllerConstructor>) {
    const options = {};
    Object.assign({}, {
        contextType: class {},
    });

    const Telegraf = jest.requireActual("telegraf") as TelegrafConstructor;
    const bot = new Telegraf<ContextMessageUpdate>("TOKEN", options);

    const service = new MiddlewareServiceImpl(new Container({ skipBaseClassChecks: true }));

    service.attachBaseMiddlewares(bot);
    service.attachControllers(bot, controllers);

    return bot;
}

describe("MiddlewareService", () => {
    test("Simple bot command", async () => {
        const func = jest.fn();

        @Controller("a")
        class TestController extends BaseController<TestController> {
            @Command("test")
            test() {
                func();
            }
        }

        const bot = createBotInstance([TestController]);

        await bot.handleUpdate({
            update_id: 1,
            message: {
                message_id: 1,
                date: 1,
                chat: {
                    id: 1,
                    type: "private",
                },
                from: {
                    id: 1,
                    is_bot: false,
                    first_name: "testuser",
                },
                text: "/atest",
                entities: [{
                    type: "bot_command",
                    offset: 0,
                    length: 6,
                }],
            },
        });

        expect(func).toBeCalledTimes(1);
    });
});
