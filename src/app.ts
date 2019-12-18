import { container } from "./container";
import { Injections } from "./constants";
import { BotService } from "./services";
import { createConnection } from "typeorm";

createConnection();

const botService = container.get<BotService>(Injections.BotService);

botService.run();
