import { AssociatedInfo } from "#/definitions";

export interface IMatatakiService {
    readonly urlPrefix: string;

    getEthWallet(userId: number): Promise<string>;
    getAssociatedInfo(userId: number): Promise<AssociatedInfo>;
    getContractAddressOfMinetoken(minetokenId: number): Promise<string>;
}
