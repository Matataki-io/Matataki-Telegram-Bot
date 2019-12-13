import { MessageHandler } from "../definitions";

export interface IGenericController { }

export interface IController<T extends { [P in keyof T]: MessageHandler }> extends IGenericController { }
