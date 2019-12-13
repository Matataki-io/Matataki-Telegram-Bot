import { Middleware, ContextMessageUpdate } from "telegraf";

export interface IGenericController { }

export interface IController<T extends { [P in keyof T]: Middleware<ContextMessageUpdate> }> extends IGenericController { }
