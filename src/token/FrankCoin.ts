import { tokenContract } from "../config/index";
import { web3 } from "../utils/eth";
const abi = require("./abi/FrankCoin.json")

const contract = new web3.eth.Contract(abi, tokenContract)
export default contract