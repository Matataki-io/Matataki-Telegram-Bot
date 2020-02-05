import { AssociatedInfo, MinetokenInfo } from "#/definitions";
import { IMatatakiService } from "#/services";

export class MatatakiServiceStub implements IMatatakiService {
    get urlPrefix() {
        return "http://MATATAKI";
    }

    getEthWallet(userId: number): Promise<string> {
        if (userId === 114514) {
            return Promise.resolve("0x1145141919810");
        }

        return Promise.reject(new Error("Associated Matataki account not found"));
    }
    getAssociatedInfo(userId: number): Promise<AssociatedInfo> {
        switch (userId) {
            case 1:
                return Promise.resolve<AssociatedInfo>({
                    user: {
                        id: 114514,
                        name: "李田所",
                    },
                    minetoken: {
                        id: 1919,
                        name: "银票",
                        symbol: "INM",
                    },
                });

            case 2:
                return Promise.resolve<AssociatedInfo>({
                    user: {
                        id: 810,
                        name: "野獣先輩",
                    }
                });

            case 3:
                return Promise.resolve<AssociatedInfo>({});

            default:
                return Promise.reject(new Error("Associated Matataki account not found"));
        }
    }
    getContractAddressOfMinetoken(minetokenId: number): Promise<string> {
        if (minetokenId === 114514 || minetokenId === 1919) {
            return Promise.resolve("0x1145141919810");
        }

        return Promise.reject(new Error("Associated contract address not found"));
    }
    getAllMinetokens(): Promise<MinetokenInfo[]> {
        return Promise.resolve([
            {
                id: 1919,
                name: "银票",
                symbol: "INM",
                contract_address: "0x1145141919810",
            }
        ]);
    }
    getUserMinetoken(userId: number, symbol: string): Promise<number> {
        if (userId === 114514 && symbol === "1919") {
            return Promise.resolve(810);
        }

        throw new Error("Failed to request user's minetoken");
    }
    transfer(from: number, to: number, symbol: string, amount: number): Promise<void> {
        if (symbol === "INM") {
            return Promise.resolve();
        }

        return Promise.reject(new Error("Failed to get minetoken id"));
    }
    getPrice(symbol: string): Promise<number> {
        if (symbol === "INM") {
            return Promise.resolve(11.4514);
        }

        return Promise.reject(new Error("Failed to get minetoken id"));
    }
}

export class MatatakiServiceNotAuthorizedStub implements IMatatakiService {
    get urlPrefix() {
        return "http://MATATAKI";
    }

    getEthWallet(userId: number): Promise<string> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getAssociatedInfo(userId: number): Promise<AssociatedInfo> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getContractAddressOfMinetoken(minetokenId: number): Promise<string> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getAllMinetokens(): Promise<MinetokenInfo[]> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getUserMinetoken(userId: number, symbol: string): Promise<number> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    transfer(from: number, to: number, symbol: string, amount: number): Promise<void> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getPrice(symbol: string): Promise<number> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
}
