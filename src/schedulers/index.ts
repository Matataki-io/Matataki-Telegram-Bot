import { IScheduler } from "./IScheduler";
export { IScheduler };

interface SchedulerConstructor {
    new(...args: any[]): IScheduler;
}
