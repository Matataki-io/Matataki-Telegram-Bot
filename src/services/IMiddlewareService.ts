import { ContextMessageUpdate, Composer } from "telegraf";

import { ControllerConstructor } from "#/controllers";

export interface IMiddlewareService {
    attachBaseMiddlewares<TContext extends ContextMessageUpdate>(bot: Composer<TContext>): void;
    attachControllers<TContext extends ContextMessageUpdate>(bot: Composer<TContext>, constructors: ControllerConstructor[]): void;
}
