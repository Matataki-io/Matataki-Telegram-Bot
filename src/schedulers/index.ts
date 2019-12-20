import { IScheduler } from "./IScheduler";
export { IScheduler };

import { GroupMemberChecker } from "./GroupMemberChecker";

interface SchedulerConstructor {
    new(...args: any[]): IScheduler;
}

export const schedulers: SchedulerConstructor[] = [
    GroupMemberChecker,
];
