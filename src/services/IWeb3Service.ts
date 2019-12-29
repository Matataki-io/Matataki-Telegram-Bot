export interface IWeb3Service {
    checkAddressChecksum(address: string, chainId?: number): boolean;
    fromWeiToEther(number: string): string;
    getBalance(contractAddress: string, walletAddress: string): number;
}
