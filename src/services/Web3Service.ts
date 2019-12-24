import Web3 from "web3";

import { Service } from "../decorators";
import { Injections } from "../constants";
import { network } from "../constants";

@Service(Injections.Web3Service)
export class Web3Service {
    private web3: Web3;

    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider(network));
    }

    checkAddressChecksum(address: string, chainId?: number) {
        return this.web3.utils.checkAddressChecksum(address, chainId);
    }
    fromWeiToEther(number: string) {
        return this.web3.utils.fromWei(number, "ether");
    }
}
