import { Entity, PrimaryColumn, Column } from "typeorm";

import { JsonColumn } from "#/decorators";

@Entity()
export class Metadata {
    @PrimaryColumn({ type: "text" })
    name!: string;

    @JsonColumn()
    value!: any;
}
