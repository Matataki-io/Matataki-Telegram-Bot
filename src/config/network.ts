// Load env
require('dotenv').config()
const INFURA_ID = String(process.env["infura.id"])

// Infura API Endpoints for different networks
export default {
    "MAINNET": `https://mainnet.infura.io/v3/${INFURA_ID}`,
    "ROPSTEN": `https://ropsten.infura.io/v3/${INFURA_ID}`,
    "KOVAN": `https://kovan.infura.io/v3/${INFURA_ID}`,
    "RINKEBY": `https://rinkeby.infura.io/v3/${INFURA_ID}`,
}