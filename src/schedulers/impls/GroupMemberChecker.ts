import { inject } from "inversify";
import { Chat, User as TelegramUser } from "telegraf/typings/telegram-types";

import { Scheduler, InjectRepository } from "#/decorators";
import { Injections, LogCategories } from "#/constants";
import { IWeb3Service, IBotService, ILoggerService } from "#/services";
import { Group, User } from "#/entities";
import { IGroupRepository } from "#/repositories";
import { IMatatakiService } from "#/services";
import { IScheduler } from "#/schedulers";
import { allPromiseSettled } from "#/utils";

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
    }
}
