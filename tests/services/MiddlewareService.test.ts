import "reflect-metadata";

import { TelegrafConstructor, ContextMessageUpdate } from "telegraf";
import { Container } from "inversify";

import { Command, Controller, Event, Action, InjectRegexMatchGroup } from "#/decorators";
import { ControllerConstructor, BaseController } from "#/controllers";
import { MiddlewareServiceImpl } from "#/services/impls/MiddlewareServiceImpl";

function createBotInstance(controllers: Array<ControllerConstructor>) {
    const Telegraf = jest.requireActual("telegraf") as TelegrafConstructor;
    const bot = new Telegraf<ContextMessageUpdate>("TOKEN");

    const service = new MiddlewareServiceImpl(new Container({ skipBaseClassChecks: true }));

    service.attachBaseMiddlewares(bot);
    service.attachControllers(bot, controllers);

    return bot;
}

describe("MiddlewareService", () => {
    describe("Command", () => {
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
        test("Simple bot command without controller prefix", async () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Command("test", { ignorePrefix: true })
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
                    text: "/test",
                    entities: [{
                        type: "bot_command",
                        offset: 0,
                        length: 6,
                    }],
                },
            });

            expect(func).toBeCalledTimes(1);
        });
        test("Ban multiple handlers for a command in multiple controllers", () => {
            @Controller("a")
            class AController extends BaseController<AController> {
                @Command("test", { ignorePrefix: true })
                test() { }
            }
            @Controller("b")
            class BController extends BaseController<BController> {
                @Command("test", { ignorePrefix: true })
                test() { }
            }

            expect(() => createBotInstance([AController, BController])).toThrowError("Command 'test' is registered by other controller");
        });
    });

    test("Simple event", async () => {
        const func = jest.fn();

        @Controller("a")
        class TestController extends BaseController<TestController> {
            @Event("text")
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

    describe("Action", () => {
        test("Simple action", async () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Action("test")
                test() {
                    func();
                }
            }

            const bot = createBotInstance([TestController]);

            await bot.handleUpdate({
                update_id: 1,
                callback_query: {
                    id: "blahblahblah",
                    from: {
                        id: 1,
                        is_bot: false,
                        first_name: "testuser",
                    },
                    chat_instance: "blahblahblah",
                    data: "test",
                },
            });

            expect(func).toBeCalledTimes(1);
        });

        describe("Action with regex", () => {
            test("Matched", async () => {
                const func = jest.fn();

                @Controller("a")
                class TestController extends BaseController<TestController> {
                    @Action(/test:(\w+)/)
                    test({}: ContextMessageUpdate, @InjectRegexMatchGroup(1) arg: string) {
                        func(arg);
                    }
                }

                const bot = createBotInstance([TestController]);

                await bot.handleUpdate({
                    update_id: 1,
                    callback_query: {
                        id: "blahblahblah",
                        from: {
                            id: 1,
                            is_bot: false,
                            first_name: "testuser",
                        },
                        chat_instance: "blahblahblah",
                        data: "test:abc",
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith("abc");
            });
            test("Not matched", async () => {
                const func = jest.fn();

                @Controller("a")
                class TestController extends BaseController<TestController> {
                    @Action(/test:(\w+)/)
                    test({}: ContextMessageUpdate, @InjectRegexMatchGroup(1) arg: string) {
                        func(arg);
                    }
                }

                const bot = createBotInstance([TestController]);

                await bot.handleUpdate({
                    update_id: 1,
                    callback_query: {
                        id: "blahblahblah",
                        from: {
                            id: 1,
                            is_bot: false,
                            first_name: "testuser",
                        },
                        chat_instance: "blahblahblah",
                        data: "test:!@#",
                    },
                });

                expect(func).toBeCalledTimes(0);
            });
        });

        test("Argument converter", async () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Action(/test:(\d+)/)
                test({}: ContextMessageUpdate, @InjectRegexMatchGroup(1, Number) arg: number) {
                    func(arg);
                }
            }

            const bot = createBotInstance([TestController]);

            await bot.handleUpdate({
                update_id: 1,
                callback_query: {
                    id: "blahblahblah",
                    from: {
                        id: 1,
                        is_bot: false,
                        first_name: "testuser",
                    },
                    chat_instance: "blahblahblah",
                    data: "test:114514",
                },
            });

            expect(func).toBeCalledTimes(1);
            expect(func).toBeCalledWith(114514);
        });
    });
});
