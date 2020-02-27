import { Minetoken, MatatakiAccount, TelegramUser, TelegramGroup } from "./Types";

export * from "./Types";

export const minetokenArray = <Array<Minetoken>>[
    {
        id: 1919,
        name: "银票",
        symbol: "INM",
        contractAddress: "0x1145141919810",
        price: 11.4514,
    },
];
export const minetokens = new Map<number, Minetoken>(minetokenArray.map(m => [m.id, m]));
export const minetokenBySymbolMap = new Map<string, Minetoken>(minetokenArray.map(m => [m.symbol, m]));

export const matatakiAccountArray = <Array<MatatakiAccount>>[
    {
        id: 1000,
        name: "一般通过爷",
        walletAddress: "0x1000",
    },
    {
        id: 114514,
        name: "李田所",
        walletAddress: "0x114514",
        minetoken: minetokens.get(1919),
    },
    {
        id: 810,
        name: "野獣先輩",
        walletAddress: "0x810",
    },
    {
        id: 811,
        name: "远野",
        walletAddress: "0x811",
    },
];
export const matatakiAccounts = new Map<number, MatatakiAccount>(matatakiAccountArray.map(m => [m.id, m]));

export const telegramUserArray = <Array<TelegramUser>>[
    {
        id: 123,
        is_bot: true,
        username: "matataki_bot",
        nickname: "Matataki Fan票机器人",
    },
    {
        id: 1,
        isBot: false,
        nickname: "新人",
    },
    {
        id: 2,
        isBot: false,
        nickname: "新人2",
        username: "theseconduser",
    },

    {
        id: 8000,
        nickname: "一般通过爷",
        matatakiAccount: matatakiAccounts.get(1000),
    },
    {
        id: 8101,
        nickname: "李田所",
        matatakiAccount: matatakiAccounts.get(114514),
    },
    {
        id: 8102,
        nickname: "野獣先輩",
        matatakiAccount: matatakiAccounts.get(810),
    },
    {
        id: 8103,
        nickname: "远野",
        matatakiAccount: matatakiAccounts.get(811),
    },
];
export const telegramUsers = new Map<number, TelegramUser>(telegramUserArray.map(u => [u.id, u]));

export const telegramGroupArray = <Array<TelegramGroup>>[
    {
        id: -114514,
        isSupergroup: true,
        title: "野兽邸",
        members: [
            {
                user: telegramUsers.get(8101),
                status: "creator",
            },
            {
                user: telegramUsers.get(123),
                status: "administrator",
            },
            {
                user: telegramUsers.get(8103),
                status: "member",
            },
        ],
        minetokenRequirement: [{
            minetoken: minetokenBySymbolMap.get("IMN"),
            amount: 114.514,
        }],
    },
    {
        id: -1919,
        isSupergroup: true,
        title: "下北沢讨论区",
        members: [
            {
                user: telegramUsers.get(8101),
                status: "creator",
            },
            {
                user: telegramUsers.get(123),
                status: "member",
            },
        ],
    },
];
