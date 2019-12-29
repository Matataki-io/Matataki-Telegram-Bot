import { ControllerConstructor } from ".";

import { DebugController } from "./DebugController";

import { WalletController } from "./WalletController";
import { GroupController } from "./GroupController";
import { QueryController } from "./QueryController";

export const controllers: ControllerConstructor[] = [
    DebugController,

    WalletController,
    GroupController,
    QueryController,
];