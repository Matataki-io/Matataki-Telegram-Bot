import { inject } from "inversify";
import { Chat } from "telegraf/typings/telegram-types";

import { Scheduler, InjectRepository } from "#/decorators";
import { Injections, LogCategories } from "#/constants";
import { IWeb3Service, IBotService, ILoggerService } from "#/services";
import { Group, User } from "#/entities";
import { IGroupRepository } from "#/repositories";
import { IMatatakiService } from "#/services";
import { IScheduler } from "#/schedulers";

@Scheduler("0 */1 * * * *")
export class GroupMemberChecker implements IScheduler {
    constructor(
        @inject(Injections.BotService) private botService: IBotService,
        @inject(Injections.Web3Service) private web3Service: IWeb3Service,
        @inject(Injections.MatatakiService) private matatakiService: IMatatakiService,
        @inject(Injections.LoggerService) private loggerService: ILoggerService,
        @InjectRepository(Group) private groupRepo: IGroupRepository) {
    }

    async onTick() {
        if (!this.botService.isRunning) {
            return;
        }

        const groups = await this.groupRepo.getGroups();
        for (const group of groups) {
            const groupId = Number(group.id);
            const balanceRequirement = group.requirement.minetoken?.amount ?? 0;

            let groupInfo: Chat;
            try {
                groupInfo = await this.botService.getGroupInfo(group);
            } catch (e) {
                if (e.code === 400 && e.description === "Bad Request: chat not found") {
                    await this.groupRepo.removeGroup(group);
                } else if (e.code === 403 && e.description === "Forbidden: bot was kicked from the supergroup chat") {
                    await this.groupRepo.setActive(group, false);
                } else {
                    this.loggerService.error(LogCategories.Cron, e);
                }
                continue;
            }

            const contractAddress = await this.matatakiService.getContractAddressOfMinetoken(group.tokenId);

            const kickedUsers = new Array<User>();

            for (const user of group.members) {
                const userId = Number(user.id);

                const userInfo = await this.botService.getMember(groupId, userId);
                if (userInfo.status !== "member") {
                    kickedUsers.push(user);
                    continue;
                }

                let walletAddress: string;
                try {
                    walletAddress = await this.matatakiService.getEthWallet(userId);
                } catch (e) {
                    try {
                        await this.botService.kickMember(groupId, userId);
                        await this.botService.sendMessage(userId, `抱歉，你现在没有绑定 瞬Matataki，现已被移出`);
                    } catch {
                        this.loggerService.warn(LogCategories.Cron, e);
                    }
                    continue;
                }

                const balance = await this.web3Service.getBalance(contractAddress, walletAddress);

                if (balance >= balanceRequirement) {
                    continue;
                }

                try {
                    await this.botService.kickMember(groupId, userId);
                    await this.botService.sendMessage(userId, `你现在的 Fan 票不满足群 ${groupInfo.title} 的条件，现已被移出`);

                    kickedUsers.push(user);
                } catch {
                    console.warn("机器人没有权限");
                }
            }

            if (kickedUsers.length === 0) {
                continue;
            }

            await this.groupRepo.removeMembers(group, kickedUsers);
        }
    }
}
