import { ControllerConstructor } from ".";

import { DebugController } from "./DebugController";

import { WalletController } from "./WalletController";
import { GroupController } from "./GroupController";
import { QueryController } from "./QueryController";
import { HelpController } from "./HelpController";

export const controllers: ControllerConstructor[] = [
    DebugController,

    HelpController,

    WalletController,
    GroupController,
    QueryController,
];