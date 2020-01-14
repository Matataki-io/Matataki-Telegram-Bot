import { AssociatedInfo, MinetokenInfo } from "#/definitions";

export interface IMatatakiService {
    readonly urlPrefix: string;

    getEthWallet(userId: number): Promise<string>;
    getAssociatedInfo(userId: number): Promise<AssociatedInfo>;
    getContractAddressOfMinetoken(minetokenId: number): Promise<string>;
    getAllMinetokens(): Promise<Array<MinetokenInfo>>;
    getUserMinetoken(userId: number, symbol: string): Promise<number>;
    transfer(from: number, to: number, symbol: string, amount: number): Promise<void>;
}
