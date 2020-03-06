import { minetokenByContractAddress, Minetoken, matatakiAccountByWalletAddress } from "../data";

export default class Web3 {
    static get providers() {
        return {
            HttpProvider,
        };
    }

    get eth() {
        return {
            Contract,
        }
    }
}

class HttpProvider {
    constructor(network: string) {
    }
}

class Contract {
    minetoken: Minetoken;

    constructor(abi: any, address: string) {
        this.minetoken = minetokenByContractAddress.get(address)!;

        const balanceOf = (walletAddress: string) => () => {
            const matatakiAccount = matatakiAccountByWalletAddress.get(walletAddress)!

            return Promise.resolve((matatakiAccount.minetokens?.find(m => m.minetoken === this.minetoken)?.amount ?? 0)* 10000);
        };

        Object.assign(this, {
            methods: {
                balanceOf,
            },
        });
    }
}
