import { Entity, PrimaryColumn, Column, Index } from "typeorm";

import { JsonColumn } from "#/decorators";

@Entity()
export class Update {
    @PrimaryColumn({ type: "int" })
    id!: number;

    @JsonColumn()
    content!: any;
}