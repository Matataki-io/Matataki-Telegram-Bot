export interface IMatatakiService {
    readonly urlPrefix: string;

    transfer(from: number, to: number, symbol: string, amount: number): Promise<string>;
    getPrice(symbol: string): Promise<number>;
}
