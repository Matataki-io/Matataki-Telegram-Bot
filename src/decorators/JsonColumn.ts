import { Column, ColumnOptions } from "typeorm";

export function JsonColumn(options?: ColumnOptions) {
    return Column({ type: globalThis.JsonColumnType, ...options });
}