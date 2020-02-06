import { config } from "dotenv";
import moment from "moment";

config();
moment.locale("zh-cn");

import path from "path";
import fs from "fs";

(function checkRequirement() {
    const huskyDirectory = path.resolve(__dirname) + "/../node_modules/husky";
    if (!fs.existsSync(huskyDirectory)) {
        console.error("Husky package required. Please run 'npm install' or 'yarn'");
        process.exit(1);
    }

    const requiredEnvironmentVariables = [
        "BOT_TOKEN",
        "INFURA_ID",
        "MATATAKI_URLPREFIX",
        "MATATAKI_APIURLPREFIX",
        "MATATAKI_ACCESS_TOKEN",
        "MATATAKI_TRANSFER_API_ACCESS_TOKEN",
    ];

    const missedEnvironmentVariables = requiredEnvironmentVariables.filter(envVar => typeof process.env[envVar] !== "string");
    if (missedEnvironmentVariables.length === 0) {
        return;
    }

    console.error("Missed the following environment variable(s):");
    for (const envVar of missedEnvironmentVariables) {
        console.error("-", envVar);
    }
    process.exit(1);
})();

import { CronJob } from "cron";

import { Injections, MetadataKeys } from "#/constants";
import { container } from "#/container";
import { IScheduler } from "#/schedulers";
import { schedulerImplementations } from "#/schedulers/impls";
import { IBotService } from "#/services";

(async function initialize() {
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
