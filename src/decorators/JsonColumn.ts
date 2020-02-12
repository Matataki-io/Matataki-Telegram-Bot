import { Column, ColumnOptions } from "typeorm";

export function JsonColumn(options?: ColumnOptions) {
    const type = process.env.NODE_ENV !== "test" ? "jsonb" : "simple-json";

    return Column({ type, ...options });
}
