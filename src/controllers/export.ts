import { ControllerConstructor } from ".";
import { DebugController } from "./DebugController";
import { DiceController } from "./DiceController";
import { GroupController } from "./GroupController";
import { HelpController } from "./HelpController";
import { WalletController } from "./WalletController";
import { QueryController } from "./QueryController";
import { RedEnvelopeController } from "./RedEnvelopeController";
import { SyncController } from "./SyncController";

export const controllers: ControllerConstructor[] = [
    DebugController,
    DiceController,
    GroupController,    
    HelpController,
    WalletController,
    QueryController,
    RedEnvelopeController,
  SyncController,
];
