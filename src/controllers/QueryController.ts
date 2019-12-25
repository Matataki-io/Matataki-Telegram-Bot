import { Controller, Command, InjectRepository } from "../decorators";
import { MessageHandlerContext, IUserRepository, IGroupRepository } from "../definitions";
import { BaseController } from ".";
import { inject } from "inversify";
import { Injections } from "../constants";
import { MatatakiService, BotService } from "../services";
import { User, Group } from "../entities";

@Controller("query")
export class QueryController extends BaseController<QueryController> {
    constructor(@inject(Injections.MatatakiService) private matatakiService: MatatakiService,
        @InjectRepository(User) private userRepo: IUserRepository,
        @InjectRepository(Group) private groupRepo: IGroupRepository,
        @inject(Injections.BotService) private botService: BotService) {
        super();
    }

    @Command("stat", { ignorePrefix: true })
    async queryToken({ message, replyWithMarkdown }: MessageHandlerContext) {
        const id = message.from.id;
        const info = await this.matatakiService.getAssociatedInfo(id);

        const array = new Array<string>();

        if (!info.user) {
            array.push("尚未绑定 瞬Matataki 账户");
        } else {
            array.push(`瞬Matataki 昵称：[${info.user.name}](${this.matatakiService.urlPrefix}/user/${info.user.id})`);
        }

        if (!info.minetoken) {
            array.push("你在 瞬Matataki 尚未发行 Fan票");
        } else {
            array.push(`Fan票 名称：[${info.minetoken.symbol}（${info.minetoken.name}）](${this.matatakiService.urlPrefix}/token/${info.minetoken.id})`);
        }

        if (info.user) {
            const user = await this.userRepo.getUser(id);

            if (!user || user.groups.length === 0) {
                array.push("你尚未加入 Fan票 群");
            } else {
                array.push(`你已加入 ${user.groups.length} 个 Fan票 群`);
                const groups = await this.botService.getGroupInfos(user.groups);
                for (const group of groups) {
                    array.push(`/ ${group.title ?? group.id}`);
                }
                array.push("");
            }

            const myGroups = await this.groupRepo.getGroupsOfCreator(id);
            if (myGroups.length === 0) {
                array.push("你尚未建立 Fan票 群");
            } else {
                array.push(`你已建立 ${myGroups.length} 个 Fan票 群`);
                const groupInfos = await this.botService.getGroupInfos(myGroups);
                for (let i = 0; i < myGroups.length; i++) {
                    const group = myGroups[i];
                    const groupInfo = groupInfos[i];

                    array.push(`/ ${groupInfo.title ?? groupInfo.id} （${group.requirements.length > 0 ? "已有规则" : "暂无规则"}）`);
                }
            }
        }

        await replyWithMarkdown(array.join("\n"));
    }
}
