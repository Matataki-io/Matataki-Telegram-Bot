export interface IScheduler {
    onTick(): void | Promise<void>;
}

export interface SchedulerConstructor {
    new(...args: any[]): IScheduler;
}
