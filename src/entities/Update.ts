import { Entity, PrimaryColumn, Column, Index } from "typeorm";

@Entity()
export class Update {
    @PrimaryColumn({ type: "int" })
    id!: number;

    @Column({ type: "jsonb" })
    content!: any;
}