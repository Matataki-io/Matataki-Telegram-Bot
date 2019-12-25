import { Entity, PrimaryColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";

import { Group } from "./Group";

@Entity()
export class User {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @ManyToMany(type => Group, group => group.members)
    @JoinTable({ name: "group_member" })
    groups!: Group[];
}
