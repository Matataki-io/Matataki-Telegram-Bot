import { I18nContext } from "./I18nContext"

export type CommandHandlerInfo = {
    argumentRegex?: RegExp,
    errorMessage?: string | ((i18n: I18nContext) => string),
    ignorePrefix: boolean,
}
