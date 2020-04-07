import { BaseController } from ".";
import { IPoemService } from "#/services";
import { inject } from "inversify";
import { Injections } from "#/constants";
import { Controller, Command, InjectRegexMatchGroup, GlobalAlias } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";

@Controller("poem")
@GlobalAlias("make", "poem")
export class PoemController extends BaseController<PoemController> {
    constructor(@inject(Injections.PoemService) private poemService: IPoemService) {
        super();
    }

    @Command("make", /(\p{sc=Han}+)$/u, ({ t }) => t("poem.badFormat"))
    async makePoem({ message, reply, i18n, telegram }: MessageHandlerContext, @InjectRegexMatchGroup(1) keyword: string) {
        const poemMessage = await reply(i18n.t("poem.generating"), {
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });

        try {
            const result = await this.poemService.make(keyword);

            await telegram.editMessageText(message.chat.id, poemMessage.message_id, undefined, result);
        } catch (e) {
            await telegram.editMessageText(message.chat.id, poemMessage.message_id, undefined, e.message);
        }
    }
}
