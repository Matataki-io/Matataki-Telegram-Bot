type AmountRequirement = {
    amount: number;
    canEqual?: boolean;
};

export type GroupRequirement = {
    minetoken?: AmountRequirement,
    liquidity?: AmountRequirement,
};
