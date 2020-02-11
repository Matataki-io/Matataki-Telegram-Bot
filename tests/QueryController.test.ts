import { MatatakiServiceStub } from "./stubs/services/MatatakiServiceStub";
import { createMockedContext } from "./Utils";
import { QueryController } from "#/controllers/QueryController";
import { UserRepositoryStub } from "./stubs/repositories/UserRepositoryStub";
import { GroupRepositoryStub } from "./stubs/repositories/GroupRepositoryStub";
import { MessageHandlerContext } from "#/definitions";

const matatakiService = new MatatakiServiceStub();

function createController() {
    return new QueryController(matatakiService, new UserRepositoryStub(), new GroupRepositoryStub(), null!, null!);
}

describe("QueryController", () => {
    describe("/status", () => {
        it("Without Matataki account", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    from: {
                        id: 3,
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
                        id: 2,
                    },
                },
            });

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[野獣先輩](http://MATATAKI/user/810)
您在 瞬Matataki 尚未发行 Fan票

*您尚未加入 Fan票 群*

*您尚未建立 Fan票 群*

输入 /join 查看更多可以加入的 Fan票 群`, { "disable_web_page_preview": true });
        });
        it("With both Matataki account and minetoken", async () => {
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
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[李田所](http://MATATAKI/user/114514)
Fan票 名称：[INM（银票）](http://MATATAKI/token/1919)

*您尚未加入 Fan票 群*

*您尚未建立 Fan票 群*

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
                    text: "/price INM"
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (Lowercase)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price inm"
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (Mixed)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price iNM"
                },
            });
            await assertSuccessfulSession(ctx);
        });
        it("Price of INM (With whitespaces)", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price   INM   "
                },
            });
            await assertSuccessfulSession(ctx);
        });

        it("Price of invalid symbol", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    text: "/price NOTFOUND"
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
                    text: "/price !@#"
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
