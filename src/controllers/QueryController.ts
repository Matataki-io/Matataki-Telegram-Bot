import { inject } from "inversify";

import { Controller, Command, InjectRepository } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Injections, LogCategories } from "#/constants";
import { User, Group } from "#/entities";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IMatatakiService, IBotService, ILoggerService } from "#/services";
import { allPromiseSettled } from "#/utils";

import { BaseController } from ".";

@Controller("query")
export class QueryController extends BaseController<QueryController> {
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.BotService) private botService: IBotService) {
        super();
    }

    @Command("status", { ignorePrefix: true })
    async queryStatus({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext) {

    }

    @Command("price", { ignorePrefix: true })
    async queryPrice({ message, reply, replyWithMarkdown }: MessageHandlerContext) {
        const match = /^\/price(?:@[\w_]+)?\s+(\w+)/.exec(message.text);
        if (!match || match.length < 2) {
            await replyWithMarkdown("格式不对，请输入 `/price [symbol]`", {
                reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
            });
            return;
        }

        const symbol = match[1].toUpperCase();

        try {
            const price = await this.matatakiService.getPrice(symbol);

            await replyWithMarkdown(`当前价格：${price} CNY`, {
                reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
            });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === "Failed to get minetoken id") {
                    await reply("抱歉，不存在这样的 Fan票", {
                        reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
                    });
                    return;
                }
            }

            throw e;
        }
    }
}
