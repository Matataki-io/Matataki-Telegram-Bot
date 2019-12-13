import "reflect-metadata";
import { Container } from "inversify";

import { Injections } from "./constants";
import { controllers } from "./controllers";
import { BotService } from "./services";

const container = new Container();

for (const controller of controllers) {
    container.bind(Injections.Controller).to(controller).inRequestScope();
}

container.bind(Injections.BotService).to(BotService).inSingletonScope();

export { container };
