import { UserInfo, TokenInfo } from "#/definitions";

export interface IBackendApiService {
    getUser(userId: number): Promise<UserInfo>;
    getUserByTelegramId(id: number): Promise<UserInfo>;
    getToken(tokenId: number): Promise<TokenInfo>;
    getToken(symbol: string): Promise<TokenInfo>;
    getTokens(): Promise<Array<TokenInfo>>;
}
