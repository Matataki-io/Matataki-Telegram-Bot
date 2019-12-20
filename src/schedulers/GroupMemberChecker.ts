import { Scheduler, InjectRepository } from "../decorators";
import { IScheduler } from "./IScheduler";
import { inject } from "inversify";
import { Injections, Tokens } from "../constants";
import { BotService, TestAccountBalanceService } from "../services";
import { Group, User } from "../entities";
import { GroupRepository } from "../repositories";

@Scheduler("0 */1 * * * *")
export class GroupMemberChecker implements IScheduler {
    constructor(
        @inject(Injections.BotService) private botService: BotService,
        @inject(Injections.TestAccountBalanceService) private tbaService: TestAccountBalanceService,
        @InjectRepository(Group) private groupRepo: GroupRepository) {

    }

    async onTick() {
        if (!this.botService.isRunning) {
            return;
        }

        const groups = await this.groupRepo.getGroups();
        for (const group of groups) {
            const groupId = Number(group.id);
            const ethRequirement = group.requirements.find(requirement => requirement.token === Tokens.Eth)?.amount ?? 0;

            const kickedUser = new Array<User>();

            for (const user of group.members) {
                const userId = Number(user.id);

                if (userId !== 1019938473 && userId !== 972107339) {
                    console.log("Not implemented now");
                    continue;
                }

                const userInfo = await this.botService.getMember(groupId, userId);
                if (userInfo.status !== "member") {
                    continue;
                }

                const balance = this.tbaService.getBalance(userId);

                if (balance >= ethRequirement) {
                    continue;
                }

                try {
                    await this.botService.kickMember(groupId, userId);

                    kickedUser.push(user);
                } catch {
                    console.warn("机器人没有权限");
                }
            }

            await this.groupRepo.removeMembers(group, kickedUser);
        }
    }
}
