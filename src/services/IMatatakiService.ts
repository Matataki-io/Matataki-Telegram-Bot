import { AssociatedInfo, MinetokenInfo, MatatakiUserInfo } from "#/definitions";

export interface IMatatakiService {
    readonly urlPrefix: string;

    getEthWallet(userId: number): Promise<string>;
    getAssociatedInfo(userId: number): Promise<AssociatedInfo>;
    getContractAddressOfMinetoken(minetokenId: number): Promise<string>;
    getAllMinetokens(): Promise<Array<MinetokenInfo>>;
    getMinetokenIdFromSymbol(symbol: string): Promise<number>;
    getUserMinetoken(userId: number, symbol: string): Promise<number>;
    transfer(from: number, to: number, symbol: string, amount: number): Promise<string>;
    getPrice(symbol: string): Promise<number>;
    getInfoByMatatakiId(matatakiId: number): Promise<MatatakiUserInfo>;
    getMinetokenSymbol(minetokenId: number): Promise<string>;
}
