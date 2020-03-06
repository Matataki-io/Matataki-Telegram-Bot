import { Web3ServiceImpl } from "#/services/impls/Web3ServiceImpl";
import { minetokenBySymbolMap, matatakiAccountByWalletAddress } from "../../data";

export class Web3ServiceStub extends Web3ServiceImpl {
    getBalance(contractAddress: string, walletAddress: string) {
        const minetoken = minetokenBySymbolMap.get(contractAddress)!;
        const matatakiAccount = matatakiAccountByWalletAddress.get(walletAddress)!;

        return Promise.resolve((matatakiAccount.minetokens?.find(m => m.minetoken === minetoken)?.amount ?? 0) / 10000);
    }
}
