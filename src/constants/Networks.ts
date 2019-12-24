const INFURA_ID = process.env["infura_id"]
if (!INFURA_ID) {
    console.error("Infura ID not found");
    process.exit(1);
}

// Infura API Endpoints for different networks
const networks = {
    MAINNET: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    ROPSTEN: `https://ropsten.infura.io/v3/${INFURA_ID}`,
    KOVAN: `https://kovan.infura.io/v3/${INFURA_ID}`,
    RINKEBY: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
}

export const network = networks.RINKEBY;
