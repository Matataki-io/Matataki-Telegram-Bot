import "reflect-metadata";

import { TelegrafConstructor, ContextMessageUpdate } from "telegraf";
import { Container } from "inversify";

import { Command, Controller, Event, Action, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { ControllerConstructor, BaseController } from "#/controllers";
import { MiddlewareServiceImpl } from "#/services/impls/MiddlewareServiceImpl";

function createBotInstance(controllers: Array<ControllerConstructor>, middleware?: (ctx: ContextMessageUpdate) => void) {
    const Telegraf = jest.requireActual("telegraf") as TelegrafConstructor;
    const bot = new Telegraf<ContextMessageUpdate>("TOKEN");

    bot.use((ctx, next) => {
        ctx.replyWithMarkdown = jest.fn();

        if (middleware) middleware(ctx);

        if (next) return next();
    });

    const service = new MiddlewareServiceImpl(new Container({ skipBaseClassChecks: true }));

    service.attachBaseMiddlewares(bot);
    service.attachControllers(bot, controllers);

    return bot;
}

describe("MiddlewareService", () => {
    test("Should use unique controller prefix", () => {
        expect(() => {
            @Controller("test")
            class AController extends BaseController<AController> {
            }
            @Controller("test")
            class BController extends BaseController<BController> {
            }

            createBotInstance([AController, BController]);
        }).toThrowError("Controller prefix 'test' has been defined");
    });

    describe("Command", () => {
        test("Only one method is applied @Command(xxx) without argument regex", () => {
            expect(() => {
                @Controller("a")
                class TestController extends BaseController<TestController> {
                    @Command("multiple")
                    a() { }
                    @Command("multiple")
                    b() { }
                }

                createBotInstance([TestController]);
            }).toThrowError("Only one method can be applied @Command(\"multiple\") without argument regex");
        });

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
            @GlobalAlias("test", "test")
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
            @GlobalAlias("test", "test")
            class AController extends BaseController<AController> {
                @Command("test", { ignorePrefix: true })
                test() { }
            }
            @Controller("b")
            @GlobalAlias("test", "test")
            class BController extends BaseController<BController> {
                @Command("test", { ignorePrefix: true })
                test() { }
            }

            expect(() => createBotInstance([AController, BController])).toThrowError("Command 'test' is registered by other controller");
        });

        describe("Dispatch with argument filter", () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Command("test", /(\d+)/)
                testA({}: ContextMessageUpdate) {
                    func("A");
                }
                @Command("test", /(\w+)/)
                testB({}: ContextMessageUpdate) {
                    func("B");
                }
                @Command("test")
                testC({}: ContextMessageUpdate) {
                    func("C");
                }

                @Command("test2", /\w+/, "Bad format")
                testD({}: ContextMessageUpdate) {
                    func("D");
                }
                @Command("test3", /\w+/, () => "Bad format")
                testE({}: ContextMessageUpdate) {
                    func("E");
                }
            }

            test.each`
            arg      | expected
            ${"123"} | ${"A"}
            ${"abc"} | ${"B"}
            ${"!@#"} | ${"C"}
            ${""} | ${"C"}
            `("/atest $arg -> '$expected'", async ({ arg, expected }) => {
                func.mockReset();

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
                        text: "/atest " + arg,
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 6,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(expected);
            });

            describe("Bad format", () => {
                test("Type A", async () => {
                    func.mockReset();

                    let context: ContextMessageUpdate | undefined;
                    const bot = createBotInstance([TestController], ctx => context = ctx);

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
                            text: "/atest2 !@#",
                            entities: [{
                                type: "bot_command",
                                offset: 0,
                                length: 7,
                            }],
                        },
                    });

                    expect(context!.replyWithMarkdown).toBeCalledWith("Bad format");
                });
                test("Type B", async () => {
                    func.mockReset();

                    let context: ContextMessageUpdate | undefined;
                    const bot = createBotInstance([TestController], ctx => context = ctx);

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
                            text: "/atest3 !@#",
                            entities: [{
                                type: "bot_command",
                                offset: 0,
                                length: 7,
                            }],
                        },
                    });

                    expect(context!.replyWithMarkdown).toBeCalledWith("Bad format");
                });
            });
        });

        describe("Inject matched argument", () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Command("test", /(\w+)/)
                testA({}: ContextMessageUpdate, @InjectRegexMatchGroup(1) arg: string) {
                    func(arg);
                }
                @Command("test2", /(\d+)/)
                testB({}: ContextMessageUpdate, @InjectRegexMatchGroup(1, Number) arg: number) {
                    func(arg);
                }
            }

            test("/atest abc123", async () => {
                func.mockReset();

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
                        text: "/atest abc123",
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 6,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith("abc123");
            });
            test("/atest2 114514", async () => {
                func.mockReset();

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
                        text: "/atest2 114514",
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 7,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(114514);
            });
        });

        describe("Command without argument", () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Command("test", /\w+/)
                testA({}: ContextMessageUpdate) {
                    func(1);
                }
                @Command("test", /$/)
                testB({}: ContextMessageUpdate) {
                    func(2);
                }
                @Command("test")
                testC({}: ContextMessageUpdate) {
                    func(3);
                }
            }

            test("/atest abc123", async () => {
                func.mockReset();

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
                        text: "/atest abc123",
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 6,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(1);
            });
            test("/atest", async () => {
                func.mockReset();

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
                expect(func).toBeCalledWith(2);
            });
            test("/atest       ", async () => {
                func.mockReset();

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
                        text: "/atest       ",
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 6,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(2);
            });
            test("/atest !@#@$@", async () => {
                func.mockReset();

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
                        text: "/atest !@#@$@",
                        entities: [{
                            type: "bot_command",
                            offset: 0,
                            length: 6,
                        }],
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(3);
            });
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

        describe("Action with arguments", () => {
            const func = jest.fn();

            @Controller("a")
            class TestController extends BaseController<TestController> {
                @Action(/test:(\w+)/)
                test({}: ContextMessageUpdate, @InjectRegexMatchGroup(1) arg: string) {
                    func(arg);
                }
                @Action(/test2:(\d+)/)
                test2({}: ContextMessageUpdate, @InjectRegexMatchGroup(1, Number) arg: number) {
                    func(arg);
                }
            }

            test("Matched", async () => {
                func.mockReset();

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
                func.mockReset();

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

            test("Argument converter", async () => {
                func.mockReset();

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
                        data: "test2:114514",
                    },
                });

                expect(func).toBeCalledTimes(1);
                expect(func).toBeCalledWith(114514);
            });
        });
    });
});
