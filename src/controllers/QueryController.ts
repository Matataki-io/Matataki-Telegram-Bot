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
    async queryStatus({ message, replyWithMarkdown, telegram }: MessageHandlerContext) {
        const id = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(id);

        const array = new Array<string>();

        if (!info.user) {
            array.push("尚未绑定 瞬Matataki 账户");
        } else {
            array.push(`瞬Matataki 昵称：[${info.user.name}](${this.matatakiService.urlPrefix}/user/${info.user.id})`);
        }

        if (!info.minetoken) {
            array.push("您在 瞬Matataki 尚未发行 Fan票");
        } else {
            array.push(`Fan票 名称：[${info.minetoken.symbol}（${info.minetoken.name}）](${this.matatakiService.urlPrefix}/token/${info.minetoken.id})`);
        }

        if (info.user) {
            const user = await this.userRepo.getUser(id);

            const joinedGroupsArray = new Array<string>();

            if (!user || user.groups.length === 0) {
                joinedGroupsArray.push("*您尚未加入 Fan票 群*");
            } else {
                const symbolMap = new Map<number, string>();
                for (const group of user.groups) {
                    if (symbolMap.has(group.tokenId)) {
                        continue;
                    }

                    const info = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

                    symbolMap.set(group.tokenId, info.minetoken!.symbol);
                }

                const results = await allPromiseSettled(user.groups.map(async group => {
                    const info = await telegram.getChat(Number(group.id));
                    const inviteLink = info.invite_link ?? await telegram.exportChatInviteLink(group.id);
                    const requiredAmount = group.requirement.minetoken?.amount ?? 0;

                    return `/ [${info.title ?? info.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.tokenId)} ≥ ${requiredAmount}` : "暂无规则"}）`;
                }));

                for (const result of results) {
                    if (result.status === "rejected") {
                        this.loggerService.error(LogCategories.TelegramUpdate, result.reason);
                        continue;
                    }

                    joinedGroupsArray.push(result.value);
                }

                joinedGroupsArray.unshift(`*您已加入 ${joinedGroupsArray.length} 个 Fan票 群*`);
            }

            const createdGroupsArray = new Array<string>();

            const myGroups = await this.groupRepo.getGroupsOfCreator(id);
            if (myGroups.length === 0) {
                createdGroupsArray.push("*您尚未建立 Fan票 群*");
            } else {
                const results = await allPromiseSettled(myGroups.map(async group => {
                    if (!group.active) {
                        return null;
                    }

                    const groupId = Number(group.id);
                    const groupInfo = await telegram.getChat(groupId);
                    const inviteLink = groupInfo.invite_link ?? await telegram.exportChatInviteLink(group.id);
                    const requiredAmount = group.requirement.minetoken?.amount ?? 0;

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

                createdGroupsArray.unshift(`*您已建立 ${createdGroupsArray.length} 个 Fan票 群*`);
            }

            array.push("");
            array.push(...joinedGroupsArray);
            array.push("");
            array.push(...createdGroupsArray);
        }

        array.push("");
        array.push("输入 /join 查看更多可以加入的 Fan票 群");

        await telegram.sendMessage(message.chat.id, array.join("\n"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
}
