import { MessageHandler } from "../definitions";

export interface IGenericController { }
export interface IController<T extends { [P in keyof T]: MessageHandler }> extends IGenericController { }

export interface ControllerConstructor {
    new(): IGenericController;
}

import { DebugController } from "./DebugController";

import { EosController } from "./EosController";
import { GroupController } from "./GroupController";

export const controllers: ControllerConstructor[] = [
    DebugController,

    EosController,
    GroupController,
];
