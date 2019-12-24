import { config } from "dotenv";

import { CronJob } from "cron";

import { container } from "./container";
import { Injections, MetadataKeys } from "./constants";
import { BotService } from "./services";
import { IScheduler, schedulers } from "./schedulers";

config();

for (const scheduler of schedulers) {
    const setting = Reflect.getMetadata(MetadataKeys.Scheduler, scheduler) as string;

    new CronJob(setting, function() {
        const instance = container.getNamed<IScheduler>(Injections.Scheduler, scheduler.name);

        instance.onTick();
    }, undefined, true);
}

const botService = container.get<BotService>(Injections.BotService);

botService.run();
