import { Entity, PrimaryColumn, ManyToMany, JoinTable, Column, Unique, Index } from "typeorm";

import { Group } from "./Group";

@Entity()
export class User {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @Column({ type: "text", nullable: true, unique: true })
    username!: string | null;

    @ManyToMany(type => Group, group => group.members)
    @JoinTable({ name: "group_member" })
    groups!: Group[];
}
