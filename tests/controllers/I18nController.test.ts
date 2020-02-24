import { createMockedContext } from "../Utils";

import { I18nController } from "#/controllers/I18nController";
import { I18nServiceImpl } from "#/services/impls/I18nServiceImpl";

function createController() {
    return new I18nController(new I18nServiceImpl());
}

describe("I18nService", () => {
    test("/setlang", async () => {
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
});
