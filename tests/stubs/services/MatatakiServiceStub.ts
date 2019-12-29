import { AssociatedInfo } from "#/definitions";
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
        if (minetokenId === 114514) {
            return Promise.resolve("0x1145141919810");
        }

        return Promise.reject(new Error("Associated contract address not found"));
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
}
