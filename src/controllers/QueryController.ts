import { inject } from "inversify";

import { Controller, Command, InjectRepository, GlobalAlias, InjectRegexMatchGroup } from "#/decorators";
import { MessageHandlerContext, UserInfo } from "#/definitions";
import { Injections, LogCategories } from "#/constants";
import { User, Group } from "#/entities";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IMatatakiService, IBotService, ILoggerService, IBackendApiService } from "#/services";
import { allPromiseSettled } from "#/utils";

import { BaseController } from ".";

@Controller("query")
@GlobalAlias("status", "status")
@GlobalAlias("price", "price")
export class QueryController extends BaseController<QueryController> {
    constructor(@inject(Injections.BackendApiService) private backendService: IBackendApiService,
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @inject(Injections.BotService) private botService: IBotService) {
        super();
    }

    @Command("status")
    async queryStatus({ message, replyWithMarkdown, telegram, i18n }: MessageHandlerContext) {
        const id = message.from.id;
        const array = new Array<string>();

        let user: UserInfo | undefined;

        try {
            user = await this.backendService.getUserByTelegramId(id);

            array.push(i18n.t("common.associatedMatatakiAccount.yes", {
                matatakiUsername: user.name,
                matatakiUserPageUrl: `${this.matatakiService.urlPrefix}/user/${user.id}`,
            }));
        } catch {
            array.push(i18n.t("common.associatedMatatakiAccount.no"));
        }

        if (!user || user.issuedTokens.length === 0) {
            array.push(i18n.t("common.mintedMinetoken.no"));
        } else {
            array.push(i18n.t("common.mintedMinetoken.yes", {
                symbol: user.issuedTokens[0].symbol,
                minetokenName: user.issuedTokens[0].name,
                minetokenPageUrl: `${this.matatakiService.urlPrefix}/token/${user.issuedTokens[0].id}`,
            }));
        }

        if (user) {
            const joinedGroup = await this.groupRepo.getJoinedGroups(id);

            const joinedGroupsArray = new Array<string>();

            if (joinedGroup.length === 0) {
                joinedGroupsArray.push(i18n.t("query.status.joinedGroup.no"));
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

                    const { symbol } = await this.backendService.getToken(minetokenId);

                    symbolMap.set(minetokenId, symbol);
                }

                const results = await allPromiseSettled(joinedGroup.map(async group => {
                    const info = await telegram.getChat(Number(group.id));
                    const inviteLink = info.invite_link ?? await telegram.exportChatInviteLink(group.id);

                    const isFandomGroup = group.requirements.length > 0;
                    const requiredAmount = isFandomGroup ? group.requirements[0].amount : -1;

                    return `/ [${info.title ?? info.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.requirements[0].minetokenId)} ≥ ${requiredAmount / 10000}` : i18n.t("query.status.groupNoRule")}）`;
                }));

                for (const result of results) {
                    if (result.status === "rejected") {
                        this.loggerService.error(LogCategories.TelegramUpdate, result.reason);
                        continue;
                    }

                    joinedGroupsArray.push(result.value);
                }

                joinedGroupsArray.unshift(i18n.t("query.status.joinedGroup.yes", {
                    count: joinedGroupsArray.length
                }));
            }

            const createdGroupsArray = new Array<string>();

            const myGroups = await this.groupRepo.getGroupsOfCreator(id);
            if (myGroups.length === 0) {
                createdGroupsArray.push(i18n.t("query.status.myGroup.no"));
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

                    return `/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${user!.issuedTokens[0].symbol} ≥ ${requiredAmount / 10000}` : i18n.t("query.status.groupNoRule")}）`;
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

                createdGroupsArray.unshift(i18n.t("query.status.myGroup.yes", {
                    count: createdGroupsArray.length
                }));
            }

            array.push("");
            array.push(...joinedGroupsArray);
            array.push("");
            array.push(...createdGroupsArray);
        }

        array.push("");
        array.push(i18n.t("query.status.tip"));

        await replyWithMarkdown(array.join("\n"), {
            disable_web_page_preview: true,
            reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
        });
    }

    @Command("price", /(\w+)/, i18n => i18n.t("query.price.badFormat"))
    async queryPrice({ message, reply, replyWithMarkdown, i18n }: MessageHandlerContext,
        @InjectRegexMatchGroup(1, input => input.toUpperCase()) symbol: string
    ) {
        try {
            const price = await this.matatakiService.getPrice(symbol);

            await replyWithMarkdown(i18n.t("query.price.response", { price }), {
                reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
            });
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === "Failed to get minetoken id") {
                    await reply(i18n.t("error.minetokenNotFound"), {
                        reply_to_message_id: message.chat.type !== "private" ? message.message_id : undefined,
                    });
                    return;
                }
            }

            throw e;
        }
    }
}
