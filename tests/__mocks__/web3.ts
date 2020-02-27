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
    constructor(abi: any, address: string) {
    }
}
