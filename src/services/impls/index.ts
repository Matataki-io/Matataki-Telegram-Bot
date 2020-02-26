import { BotServiceImpl } from "./BotServiceImpl";
import { DatabaseServiceImpl } from "./DatabaseServiceImpl";
import { LoggerServiceImpl } from "./LoggerServiceImpl";
import { MatatakiServiceImpl } from "./MatatakiServiceImpl";
import { Web3ServiceImpl } from "./Web3ServiceImpl";
import { RedEnvelopeServiceImpl } from "./RedEnvelopeServiceImpl";
import { DiceServiceImpl } from "./DiceServiceImpl";
import { I18nServiceImpl } from "./I18nServiceImpl";
import { MiddlewareServiceImpl } from "./MiddlewareServiceImpl";

export const serviceImplementations = [
    BotServiceImpl,
    DatabaseServiceImpl,
    LoggerServiceImpl,
    MatatakiServiceImpl,
    Web3ServiceImpl,
    RedEnvelopeServiceImpl,
    DiceServiceImpl,
    I18nServiceImpl,
    MiddlewareServiceImpl,
];
