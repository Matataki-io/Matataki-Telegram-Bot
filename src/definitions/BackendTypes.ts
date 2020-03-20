export type TokenInfo = {
    id: number,
    name: string,
    contractAddress: string,
    symbol: string,
    issuer: UserInfo,
}

export type UserInfo = {
    id: number;
    name: string;
    walletAddress: string;
    telegramUid: number | null;
    issuedTokens: Array<TokenInfo>;
}
