import { IController, BaseController } from "./BaseController";
export { IController, BaseController };

export interface ControllerConstructor {
    new(): IController;
}

import { DebugController } from "./DebugController";

import { EthController } from "./EthController";
import { GroupController } from "./GroupController";

export const controllers: ControllerConstructor[] = [
    DebugController,

    EthController,
    GroupController,
];
