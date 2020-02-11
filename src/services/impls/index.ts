import { BotServiceImpl } from "./BotServiceImpl";
import { DatabaseServiceImpl } from "./DatabaseServiceImpl";
import { LoggerServiceImpl } from "./LoggerServiceImpl";
import { MatatakiServiceImpl } from "./MatatakiServiceImpl";
import { Web3ServiceImpl } from "./Web3ServiceImpl";
import { RedEnvelopeServiceImpl } from "./RedEnvelopeServiceImpl";
import { DiceServiceImpl } from "./DiceServiceImpl";

export const serviceImplementations = [
    BotServiceImpl,
    DatabaseServiceImpl,
    LoggerServiceImpl,
    MatatakiServiceImpl,
    Web3ServiceImpl,
    RedEnvelopeServiceImpl,
    DiceServiceImpl
];
