export interface IScheduler {
    onTick(): void | Promise<void>;
}