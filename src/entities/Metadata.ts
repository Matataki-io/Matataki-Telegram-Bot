import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Metadata {
    @PrimaryColumn({ type: "text" })
    name!: string;

    @Column({ type: "jsonb" })
    value!: object;
}
