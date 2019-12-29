import { MatatakiServiceStub } from "./stubs/services/MatatakiServiceStub";
import { createMockedContext } from "./Utils";
import { QueryController } from "#/controllers/QueryController";
import { Message } from "telegraf/typings/telegram-types";

const matatakiService = new MatatakiServiceStub();

describe("QueryController", () => {
    describe("/stat", () => {
        it("Without Matataki account", async () => {
            const ctx = createMockedContext();
            // @ts-ignore
            ctx.message = {
                from: {
                    id: 3,
                },
            } as Message;

            const controller = new QueryController(matatakiService, null!, null!, null!);
            await controller.queryStat(ctx);

            expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
            expect(ctx.replyWithMarkdown).toBeCalledWith(`尚未绑定 瞬Matataki 账户
你在 瞬Matataki 尚未发行 Fan票`);
        });
    });
});
