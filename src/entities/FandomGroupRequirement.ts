import { Entity, PrimaryColumn, ManyToOne, Column } from "typeorm";
import { Group } from "./Group";

@Entity()
export class FandomGroupRequirement {
    @PrimaryColumn({ type: "int" })
    minetokenId!: number;

    @Column({ type: "bigint" })
    amount!: number;
    @Column({ type: "boolean" })
    amountCanEqual!: boolean;

    @ManyToOne(() => Group, group => group.requirements, { primary: true })
    group!: Group;
}
