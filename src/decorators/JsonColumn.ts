import { Column, ColumnOptions } from "typeorm";

declare global {
    namespace globalThis {
       var JsonColumnType: "jsonb" | "simple-json";
    }
}

export function JsonColumn(options?: ColumnOptions) {
    return Column({ type: globalThis.JsonColumnType ?? "jsonb", ...options });
}