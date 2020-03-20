import { createMockedContext } from "../Utils";
import { WalletController } from "#/controllers/WalletController";
import { MatatakiServiceStub } from "../stubs/services/MatatakiServiceStub";
import { Web3ServiceStub } from "../stubs/services/Web3ServiceStub";
import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";

function createController() {
    return new WalletController(new MatatakiServiceStub(), null!, new Web3ServiceStub(), new UserRepositoryStub());
}

describe("WalletControll", () => {
    test("Query token by matataki ID", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                from: {
                    id: 1,
                    username: "thefirstuser",
                },
            },
        });

        await createController().queryMatatakiAccountTokenById(ctx, 114514, "INM");

        expect(ctx.reply).toBeCalledTimes(1);
        expect(ctx.reply).toBeCalledWith("114514.1919 INM", {});
    });
    test("Query token by username", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                from: {
                    id: 1,
                    username: "thefirstuser",
                },
            },
        });

        await createController().queryMatatakiAccountTokenByUsername(ctx, "tadorokokouji", "INM");

        expect(ctx.reply).toBeCalledTimes(1);
        expect(ctx.reply).toBeCalledWith("114514.1919 INM", {});
    });
    test("Query my tokens", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                from: {
                    id: 8101,
                },
            },
        });

        await createController().queryMyTokens(ctx, null!);

        expect(ctx.replyWithMarkdown).toBeCalledTimes(1);
        expect(ctx.replyWithMarkdown).toBeCalledWith(`瞬Matataki 昵称：[李田所](http://MATATAKIuser/114514)
Fan票 名称：[INM（银票）](http://MATATAKItoken/1919)

*您当前持有 1 种 Fan票*
[银票（INM）](http://MATATAKItoken/1919)： 114514.1919`, { disable_web_page_preview: true });
    });
});
