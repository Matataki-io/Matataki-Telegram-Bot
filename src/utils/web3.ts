import Web3 from "web3";
import { network } from "../config";

export const web3 = new Web3(new Web3.providers.HttpProvider(network));

export const checkAddressChecksum = web3.utils.checkAddressChecksum
export const fromWeiToEther = (number: string) => web3.utils.fromWei(number, "ether")