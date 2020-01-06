import { MatatakiServiceStub } from "./stubs/services/MatatakiServiceStub";
import { createMockedContext } from "./Utils";
import { QueryController } from "#/controllers/QueryController";
import { Message } from "telegraf/typings/telegram-types";
import { UserRepositoryStub } from "./stubs/repositories/UserRepositoryStub";
import { GroupRepositoryStub } from "./stubs/repositories/GroupRepositoryStub";

const matatakiService = new MatatakiServiceStub();

function createController() {
    return new QueryController(matatakiService, new UserRepositoryStub(), new GroupRepositoryStub(), null!);
}

describe("QueryController", () => {
    describe("/status", () => {
        it("Without Matataki account", async () => {
            const ctx = createMockedContext();
            // @ts-ignore
            ctx.message = {
                from: {
                    id: 3,
                },
            } as Message;

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`尚未绑定 瞬Matataki 账户
你在 瞬Matataki 尚未发行 Fan票`);
        });
        it("With Matataki account but no minetoken", async () => {
            const ctx = createMockedContext();
            // @ts-ignore
            ctx.message = {
                from: {
                    id: 2,
                },
            } as Message;

            const controller = createController();
            await controller.queryStat(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[野獣先輩](http://MATATAKI/user/810)
你在 瞬Matataki 尚未发行 Fan票
你尚未加入 Fan票 群
你尚未建立 Fan票 群`);
        });
        it("With both Matataki account and minetoken", async () => {
            const ctx = createMockedContext();
            // @ts-ignore
            ctx.message = {
                from: {
                    id: 1,
                },
            } as Message;

            const controller = createController();
            await controller.queryStatus(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[李田所](http://MATATAKI/user/114514)
Fan票 名称：[INM（银票）](http://MATATAKI/token/1919)
你尚未加入 Fan票 群
你尚未建立 Fan票 群`);
        });
    });
});
