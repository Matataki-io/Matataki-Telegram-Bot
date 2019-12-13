import "reflect-metadata";
import { Container } from "inversify";

import { Injections } from "./constants";
import { DebugController, UserController, GroupController } from "./controllers";
import { BotService } from "./services";

const container = new Container();

container.bind(Injections.Controller).to(DebugController);

container.bind(Injections.Controller).to(UserController);
container.bind(Injections.Controller).to(GroupController);

container.bind(Injections.BotService).to(BotService).inSingletonScope();

export { container };
