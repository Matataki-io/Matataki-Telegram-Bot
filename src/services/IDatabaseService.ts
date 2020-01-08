export interface IDatabaseService {
    ensureDatabase(): Promise<void>;
}
