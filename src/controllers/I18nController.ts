import { inject } from "inversify";
import { Markup } from "telegraf";

import { BaseController } from ".";
import { Controller, Command, Action, PrivateChatOnly, InjectRepository, InjectRegexMatchGroup } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Injections } from "#/constants";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";
import { II18nService } from "#/services";

@Controller("i18n")
export class I18nController extends BaseController<I18nController> {
    constructor(@inject(Injections.I18nService) private i18nService: II18nService,
        @InjectRepository(User) private userRepo: IUserRepository) {
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
    async switchLanguage({ answerCbQuery, reply, i18n, callbackQuery }: MessageHandlerContext, @InjectRegexMatchGroup(1) language: string) {
        i18n.language = language;

        const user = await this.userRepo.ensureUser(callbackQuery!.from);
        await this.userRepo.setUserLanguage(user, i18n.language);

        await answerCbQuery();
        await reply(`Current language: ${i18n.t("lang")}`);
    }
}
