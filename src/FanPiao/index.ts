import { web3 } from "../utils/web3";
import { ABI } from "./abi";

const contract = (address :string) => new web3.eth.Contract(ABI, address)

export default contract