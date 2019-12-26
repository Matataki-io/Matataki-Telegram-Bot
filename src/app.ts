import { config } from "dotenv";

config();

import { CronJob } from "cron";

import { container } from "./container";
import { Injections, MetadataKeys } from "./constants";
import { BotService } from "./services";
import { IScheduler, schedulers } from "./schedulers";

(async function () {
    const botService = container.get<BotService>(Injections.BotService);

    await botService.run();

    for (const scheduler of schedulers) {
        const setting = Reflect.getMetadata(MetadataKeys.Scheduler, scheduler) as string;

        new CronJob(setting, function() {
            const instance = container.getNamed<IScheduler>(Injections.Scheduler, scheduler.name);

            instance.onTick();
        }, undefined, true);
    }
})();
