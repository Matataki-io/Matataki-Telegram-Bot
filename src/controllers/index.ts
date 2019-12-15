import { MessageHandler } from "../definitions";

export interface IGenericController { }
export interface IController<T extends { [P in keyof T]: MessageHandler }> extends IGenericController { }

export interface ControllerConstructor {
    new(): IGenericController;
}

import { DebugController } from "./DebugController";

import { EthController } from "./EthController";
import { GroupController } from "./GroupController";

export const controllers: ControllerConstructor[] = [
    DebugController,

    EthController,
    GroupController,
];
