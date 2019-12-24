import { BotService } from "./BotService";
import { TestAccountBalanceService } from "./TestAccountBalanceService";
import { DatabaseService } from "./DatabaseService";
import { MatatakiService } from "./MatatakiService";
import { Web3Service } from "./Web3Service";

export {
    BotService,
    TestAccountBalanceService,
    DatabaseService,
    MatatakiService,
    Web3Service,
};

export const services = [
    BotService,
    TestAccountBalanceService,
    DatabaseService,
    MatatakiService,
    Web3Service,
];
