import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { Tokens } from "../constants";
import { Group } from "./Group";

@Entity()
export class GroupRequirement {
    @ManyToOne(type => Group, group => group.requirements, { primary: true })
    group!: Group;

    @PrimaryColumn({ type: "enum", enum: Tokens, enumName: "token" })
    token!: Tokens;

    @Column({ type: "bigint" })
    amount!: number;
}
