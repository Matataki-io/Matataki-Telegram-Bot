import { container } from "./container";
import { Injections } from "./constants";
import { BotService } from "./services";

const botService = container.get<BotService>(Injections.BotService);

botService.run();
