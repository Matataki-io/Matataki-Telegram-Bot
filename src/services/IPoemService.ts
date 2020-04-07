export interface IPoemService {
    make(keyword: string): Promise<string>;
}
