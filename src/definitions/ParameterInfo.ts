import { ParameterTypes } from "#/constants";

type GeneralParameterInfo = {
    type: ParameterTypes,
}

type RegexMatchGroupParameterInfo = {
    type: ParameterTypes.RegexMatchGroup,
    converter?: (input: string) => any,
}

export type ParameterInfo = GeneralParameterInfo | RegexMatchGroupParameterInfo;
