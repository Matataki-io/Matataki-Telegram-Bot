import { ParameterTypes } from "#/constants";

type GeneralParameterInfo = {
    type: ParameterTypes.SenderMatatakiInfo,
}

export type RegexMatchGroupParameterInfo = {
    type: ParameterTypes.RegexMatchGroup,
    groupIndex: number,
    converter?: (input: string) => any,
}

export type ParameterInfo = GeneralParameterInfo | RegexMatchGroupParameterInfo;
