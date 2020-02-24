import { getRepository } from "typeorm";

import { createMockedContext } from "../Utils";

import { I18nController } from "#/controllers/I18nController";
import { I18nServiceImpl } from "#/services/impls/I18nServiceImpl";
import { UserRepositoryStub } from "../stubs/repositories/UserRepositoryStub";
import { User } from "#/entities";
import { I18nContext, ControllerMethodContext } from "#/definitions";
import { MetadataKeys, Injections } from "#/constants";
import { IUserRepository } from "#/repositories";

const service = new I18nServiceImpl();

function createController() {
    return new I18nController(service, new UserRepositoryStub());
}

describe("I18nService", () => {
    describe("/setlang", () => {
        test("Menu", async () => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                },
            });

            const controller = createController();
            await controller.setLanguage(ctx);

            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith("Please choose the language you want to switch", {
                reply_markup: {
                    inline_keyboard: [
                        [{ callback_data: "setlang:en", hide: false, text: "English" }],
                        [{ callback_data: "setlang:ja", hide: false, text: "日本語" }],
                        [{ callback_data: "setlang:ru", hide: false, text: "Русский" }],
                        [{ callback_data: "setlang:zh-hans", hide: false, text: "简体中文" }],
                        [{ callback_data: "setlang:zh-hant", hide: false, text: "繁體中文" }],
                    ],
                },
            });
        });

        test.each`
        language     | languageName
        ${"en"}      | ${"English"}
        ${"ja"}      | ${"日本語"}
        ${"ru"}      | ${"Русский"}
        ${"zh-hans"} | ${"简体中文"}
        ${"zh-hant"} | ${"繁體中文"}
        `("setlang:$language", async ({ language, languageName }) => {
            const ctx = createMockedContext();
            Object.assign(ctx, {
                message: {
                    ...ctx.message,
                    chat: {
                        type: "private",
                    },
                    from: {
                        id: 1,
                    },
                },
                match: [, language],
                i18n: service.getDefaultContext(language),
            });

            const controller = createController();
            await controller.switchLanguage(ctx);

            expect(ctx.answerCbQuery).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledTimes(1);
            expect(ctx.reply).toBeCalledWith(`Current language: ${languageName}`);

            const userRepo = getRepository(User);
            let user = await userRepo.findOneOrFail(1);

            expect(user.language).toBe(language);
        });
    });

    test("Query database at the first time", async () => {
        const ctx = createMockedContext();
        Object.assign(ctx, {
            message: {
                ...ctx.message,
                chat: {
                    type: "private",
                },
                from: {
                    id: 3,
                    name: "achineseuser",
                    language: "zh-hans",
                },
            },
        });

        const mockedUserRepo = {
            getUser: jest.fn(() => "zh-hans"),
        };
        const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
        context.container.bind(Injections.Repository).toConstantValue(mockedUserRepo).whenTargetNamed(User.name);

        await service.middleware()(ctx);
        await service.middleware()(ctx);
        await service.middleware()(ctx);
        await service.middleware()(ctx);
        await service.middleware()(ctx);
        expect(mockedUserRepo.getUser).toBeCalledTimes(1);
    });
});
