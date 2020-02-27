export type Minetoken = {
    id: number,
    name: string,
    symbol: string,
    contractAddress: string,
    price: number,
};

export type MatatakiAccount = {
    id: number,
    name: string,
    walletAddress: string,
    minetoken?: Minetoken,
};

export type TelegramUser = {
    id: number,
    isBot: boolean,
    nickname: string,
    username?: string,
    matatakiAccount?: MatatakiAccount,
};

export type FanGroupMinetokenRequirement = {
    minetoken: Minetoken,
    amount: number,
};

export type TelegramGroupMember = {
    user: TelegramUser,
    status: "creator" | "administrator" | "member" | "kicked" | "restrict" | "left",
};
export type TelegramGroup = {
    id: number,
    isSupergroup: boolean,
    title: string,
    members: Array<TelegramGroupMember>,
    minetokenRequirement?: Array<FanGroupMinetokenRequirement>,
};
