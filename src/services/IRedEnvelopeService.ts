type MatatakiUser = { id: number, name: string };
export interface IRedEnvelopeService {
    registerEnvelope(user: MatatakiUser,
        unit: string, amountArr: number[], quantity: number,
        description: string): void;
    grab(user: MatatakiUser): Promise<string[]>;
}