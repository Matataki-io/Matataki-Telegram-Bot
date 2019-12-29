import { config } from "dotenv";

config();

import { CronJob } from "cron";

import { Injections, MetadataKeys } from "#/constants";
import { container } from "#/container";
import { IScheduler } from "#/schedulers";
import { schedulerImplementations } from "#/schedulers/impls";
import { IBotService } from "#/services";

(async function () {
    const botService = container.get<IBotService>(Injections.BotService);

    await botService.run();

    for (const scheduler of schedulerImplementations) {
        const setting = Reflect.getMetadata(MetadataKeys.Scheduler, scheduler) as string;

        new CronJob(setting, function() {
            const instance = container.getNamed<IScheduler>(Injections.Scheduler, scheduler.name);

            instance.onTick();
        }, undefined, true);
    }
})();
