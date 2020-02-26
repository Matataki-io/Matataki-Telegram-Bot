import { ControllerConstructor } from ".";
import { DebugController } from "./DebugController";
import { DiceController } from "./DiceController";
import { GroupController } from "./GroupController";
import { HelpController } from "./HelpController";
import { WalletController } from "./WalletController";
import { QueryController } from "./QueryController";
import { RedEnvelopeController } from "./RedEnvelopeController";
import { SyncController } from "./SyncController";
import { I18nController } from "./I18nController";
import { RPSController } from "./RPSController";

export const controllers: ControllerConstructor[] = [
    DebugController,
    DiceController,
    RPSController,
    GroupController,
    HelpController,
    WalletController,
    QueryController,
    RedEnvelopeController,
    SyncController,
    I18nController,
];
