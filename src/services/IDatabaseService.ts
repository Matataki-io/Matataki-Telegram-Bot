export interface IDatabaseService {
    waitForConnectionCreated(): Promise<void>;
}
