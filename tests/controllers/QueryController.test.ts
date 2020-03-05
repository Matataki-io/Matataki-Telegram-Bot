import { QueryController } from "#/controllers/QueryController";
import { MessageHandlerContext } from "#/definitions";

import { createMockedContext } from "../Utils";
import { MatatakiServiceStub } from "../stubs/services/MatatakiServiceStub";
import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";
import { GroupRepositoryStub } from "../stubs/repositories/GroupRepositoryStub";
import { LoggerServiceStub } from "../stubs/services/LoggerServiceStub";
import { BotServiceStub } from "../stubs/services/BotServiceStub";

const matatakiService = new MatatakiServiceStub();

function createController() {
    return new QueryController(matatakiService, new UserRepositoryStub(), new GroupRepositoryStub(), new LoggerServiceStub(), new BotServiceStub());
}

describe("QueryController", () => {
    describe("/status", () => {
        it("Without Matataki account", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 1,
                    },
                },
            });

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`尚未绑定 瞬Matataki 账户
您在 瞬Matataki 尚未发行 Fan票

输入 /join 查看更多可以加入的 Fan票 群`, { "disable_web_page_preview": true });
        });
        it("With Matataki account but no minetoken", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 8102,
                    },
                },
            });
            ctx.telegram.getChat.mockResolvedValue({
                id: -1919,
                title: "下北沢讨论区",
                type: "supergroup",
            });
            ctx.telegram.exportChatInviteLink.mockResolvedValue("http://invitelink");

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[野獣先輩](http://MATATAKI/user/810)
您在 瞬Matataki 尚未发行 Fan票

*您已加入 1 个 Fan票 群*
/ [下北沢讨论区](http://invitelink) （暂无规则）

*您尚未建立 Fan票 群*

输入 /join 查看更多可以加入的 Fan票 群`, { "disable_web_page_preview": true });
        });
        it("With both Matataki account and minetoken", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 8101,
                    },
                },
            });
            ctx.telegram.getChat.mockImplementation(chatId => {
                switch (Number(chatId)) {
                    case -1919:
                        return Promise.resolve({
                            id: -1919,
                            title: "下北沢讨论区",
                            type: "supergroup",
                        });

                    case -114514:
                        return Promise.resolve({
                            id: -114514,
                            title: "野兽邸",
                            type: "supergroup",
                        });

                    default: return Promise.reject();
                };
            });
            ctx.telegram.getChatMembersCount.mockImplementation(chatId => {
                switch (Number(chatId)) {
                    case -1919:
                        return Promise.resolve(5);

                    case -114514:
                        return Promise.resolve(3);

                    default: return Promise.reject();
                };
            });
            ctx.telegram.getChatAdministrators.mockImplementation(chatId => {
                switch (Number(chatId)) {
                    case -1919:
                        return Promise.resolve([
                            {
                                status: "creator",
                                user: {
                                    id: 8101,
                                    is_bot: false,
                                    first_name: "李田所",
                                },
                            },
                        ]);

                    case -114514:
                        return Promise.resolve([
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
                            },
                        ]);

                    default: return Promise.reject();
                }
            });
            ctx.telegram.exportChatInviteLink.mockResolvedValue("http://invitelink");

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[李田所](http://MATATAKI/user/114514)
Fan票 名称：[INM（银票）](http://MATATAKI/token/1919)

*您尚未加入 Fan票 群*

*您已建立 1 个 Fan票 群*
/ [野兽邸](http://invitelink) （INM ≥ 1145140）

输入 /join 查看更多可以加入的 Fan票 群`, { "disable_web_page_preview": true });
        });
    });

    describe("/price", () => {
        async function assertSuccessfulSession(ctx: MessageHandlerContext) {
            const controller = createController();
            await controller.queryPrice(ctx);

            expect(ctx.reply).toBeCalledTimes(0);
            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith("当前价格：11.4514 CNY", {});
        }

        it("Price of INM (Uppercase)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price INM",
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (Lowercase)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price inm",
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (Mixed)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price iNM",
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (With whitespaces)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price   INM   ",
                },
            });
            await assertSuccessfulSession(ctx);
        });

        it("Price of invalid symbol", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price NOTFOUND",
                },
            });

            const controller = createController();
            await controller.queryPrice(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(0);
            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("抱歉，不存在这样的 Fan票", {});
        });

        it("Request with bad format", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price !@#",
                },
            });

            const controller = createController();
            await controller.queryPrice(ctx);

            expect(ctx.reply).toBeCalledTimes(0);
            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith("格式不对，请输入 `/price [symbol]`", {});
        });
    });
});
