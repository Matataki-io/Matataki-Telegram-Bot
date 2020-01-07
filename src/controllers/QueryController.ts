import { inject } from "inversify";

import { Controller, Command, InjectRepository } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { Injections, LogCategories } from "#/constants";
import { User, Group } from "#/entities";
import { IUserRepository, IGroupRepository } from "#/repositories";
import { IMatatakiService, IBotService, ILoggerService } from "#/services";

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
            array.push("");

            const user = await this.userRepo.getUser(id);

            if (!user || user.groups.length === 0) {
                array.push("*您尚未加入 Fan票 群*");
            } else {
                const symbolMap = new Map<number, string>();
                for (const group of user.groups) {
                    if (symbolMap.has(group.tokenId)) {
                        continue;
                    }

                    const info = await this.matatakiService.getAssociatedInfo(Number(group.creatorId));

                    symbolMap.set(group.tokenId, info.minetoken!.symbol);
                }

                array.push(`*您已加入 ${user.groups.length} 个 Fan票 群*`);
                const groupInfos = await this.botService.getGroupInfos(user.groups);
                for (let i = 0; i < user.groups.length; i++) {
                    try {
                        const group = user.groups[i];
                        const groupInfo = groupInfos[i];
                        const inviteLink = groupInfo.invite_link ?? await telegram.exportChatInviteLink(group.id);
                        const requiredAmount = group.requirement.minetoken?.amount ?? 0;

                        array.push(`/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${symbolMap.get(group.tokenId)} ≥ ${requiredAmount}` : "暂无规则"}）`);
                    } catch (e) {
                        this.loggerService.error(LogCategories.TelegramUpdate, e);
                    }
                }
            }

            array.push("");

            const myGroups = await this.groupRepo.getGroupsOfCreator(id);
            if (myGroups.length === 0) {
                array.push("*您尚未建立 Fan票 群*");
            } else {
                array.push(`*您已建立 ${myGroups.length} 个 Fan票 群*`);
                const groupInfos = await this.botService.getGroupInfos(myGroups);
                for (let i = 0; i < myGroups.length; i++) {
                    try {
                        const group = myGroups[i];
                        const groupInfo = groupInfos[i];
                        const inviteLink = groupInfo.invite_link ?? await telegram.exportChatInviteLink(group.id);
                        const requiredAmount = group.requirement.minetoken?.amount ?? 0;

                        array.push(`/ [${groupInfo.title ?? groupInfo.id}](${inviteLink}) （${requiredAmount > 0 ? `${info.minetoken!.symbol} ≥ ${requiredAmount}` : "暂无规则"}）`);
                    } catch (e) {
                        this.loggerService.error(LogCategories.TelegramUpdate, e);
                    }
                }
            }
        }

        array.push("");
        array.push("输入 /join 查看更多可以加入的 Fan票 群");

        await telegram.sendMessage(message.chat.id, array.join("\n"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
}
