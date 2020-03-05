import { inject } from "inversify";

import { Controller, Command, InjectRepository, GlobalAlias } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Injections, LogCategories } from "#/constants";
import { User, Group } from "#/entities";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IMatatakiService, IBotService, ILoggerService } from "#/services";
import { allPromiseSettled } from "#/utils";

import { BaseController } from ".";

@Controller("query")
@GlobalAlias("status", "status")
@GlobalAlias("price", "price")
export class QueryController extends BaseController<QueryController> {
    constructor(@inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.BotService) private botService: IBotService) {
        super();
    }

    @Command("status")
    async queryStatus({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext) {
        const id = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(id);

        const array = new Array<string>();

        if (!info.user) {
            array.push(i18n.t("status.notUser"));
        } else {
            array.push(`瞬Matataki 昵称：[${info.user.name}](${this.matatakiService.urlPrefix}/user/${info.user.id})`);
        }

        if (!info.minetoken) {
            array.push(i18n.t("status.notToken"));
        } else {
            array.push(`Fan票 名称：[${info.minetoken.symbol}（${info.minetoken.name}）](${this.matatakiService.urlPrefix}/token/${info.minetoken.id})`);
        }

        if (info.user) {
            const joinedGroup = await this.groupRepo.getJoinedGroups(id);

            const joinedGroupsArray = new Array<string>();

            if (joinedGroup.length === 0) {
                joinedGroupsArray.push(i18n.t("status.notJoined"));
            } else {
                const symbolMap = new Map<number, string>();
                for (const group of joinedGroup) {
                    if (group.requirements.length === 0 || symbolMap.has(group.requirements[0].minetokenId)) {
                        continue;
                    }

                    const minetokenId = group.requirements[0].minetokenId;
                    if (symbolMap.has(minetokenId)) {
                        continue;
                    }

                    const symbol = await this.matatakiService.getMinetokenSymbol(minetokenId);

                    symbolMap.set(minetokenId, symbol);
                }

                const results = await allPromiseSettled(joinedGroup.map(async group => {
                    const info = await telegram.getChat(Number(group.id));
                    const inviteLink = info.invite_link ?? await telegram.exportChatInviteLink(group.id);

                    const isFandomGroup = group.requirements.length > 0;
                    const requiredAmount = isFandomGroup ? group.requirements[0].amount : -1;

                    return `/ [${info.title ?? info.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.requirements[0].minetokenId)} ≥ ${requiredAmount}` : "暂无规则"}）`;
                }));

                for (const result of results) {
                    if (result.status === "rejected") {
                        this.loggerService.error(LogCategories.TelegramUpdate, result.reason);
                        continue;
                    }

                    joinedGroupsArray.push(result.value);
                }

                joinedGroupsArray.unshift(i18n.t("status.joinedGroups", {
                    joinedGroups: joinedGroupsArray.length
                }));
            }

            const createdGroupsArray = new Array<string>();

            const myGroups = await this.groupRepo.getGroupsOfCreator(id);
            if (myGroups.length === 0) {
                createdGroupsArray.push(i18n.t("status.notCreatedGroups"));
            } else {
                const results = await allPromiseSettled(myGroups.map(async group => {
                    const groupId = Number(group.id);
                    const groupInfo = await telegram.getChat(groupId);
                    const inviteLink = groupInfo.invite_link ?? await telegram.exportChatInviteLink(group.id);

                    const isFandomGroup = group.requirements.length > 0;
                    const requiredAmount = isFandomGroup ? group.requirements[0].amount : -1;

                    const memberCount = await telegram.getChatMembersCount(groupId);
                    if (memberCount === 1) {
                        return null;
                    }

                    const admins = await telegram.getChatAdministrators(groupId);
                    let hasCreator = false;
                    let hasMe = false;
                    for (const admin of admins) {
                        if (admin.status === "creator") {
                            hasCreator = true;
                            continue;
                        }

                        if (admin.user.id === this.botService.info.id) {
                            hasMe = true;
                        }
                    }
                    if (!hasCreator || !hasMe) {
                        return null;
                    }

                    return `/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${info.minetoken!.symbol} ≥ ${requiredAmount}` : "暂无规则"}）`;
                }));

                for (const result of results) {
                    if (result.status === "rejected") {
                        this.loggerService.error(LogCategories.TelegramUpdate, result.reason);
                        continue;
                    }

                    if (result.value) {
                        createdGroupsArray.push(result.value);
                    }
                }

                createdGroupsArray.unshift(i18n.t("status.createdGroups", {
                    createdGroups: createdGroupsArray.length
                }));
            }

            array.push("");
            array.push(...joinedGroupsArray);
            array.push("");
            array.push(...createdGroupsArray);
        }

        array.push("");
        array.push(i18n.t("status.seeMore"));

        await replyWithMarkdown(array.join("\n"), {
            disable_web_page_preview: true,
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("price")
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
