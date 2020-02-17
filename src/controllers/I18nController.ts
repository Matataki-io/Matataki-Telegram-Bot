import { inject } from "inversify";
import { Markup } from "telegraf";

import { BaseController } from ".";
import { Controller, Command, Action, PrivateChatOnly } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Injections } from "#/constants";
import { II18nService } from "#/services";

@Controller("i18n")
export class I18nController extends BaseController<I18nController> {
    constructor(@inject(Injections.I18nService) private i18nService: II18nService) {
        super();
    }

    @Command("setlang", { ignorePrefix: true })
    @PrivateChatOnly()
    setLanguage({ reply, i18n }: MessageHandlerContext) {
        return reply("Please choose the language you want to switch", Markup.inlineKeyboard(
            this.i18nService.getInstalledLanguages().map(language => [
                Markup.callbackButton(this.i18nService.t(language, "lang"), "setlang:" + language),
            ])
        ).extra());
    }

    @Action(/setlang:([\w-]+)/)
    async switchLanguage({ answerCbQuery, reply, match, i18n }: MessageHandlerContext) {
        i18n.language = match![1];

        await answerCbQuery();
        await reply(`Current language: ${i18n.t("lang")}`);
    }
}
