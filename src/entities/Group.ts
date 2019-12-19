import { Entity, PrimaryColumn, ManyToMany, Column, Index } from "typeorm";

import { User } from "./User";

@Entity()
export class Group {
    @PrimaryColumn({ type: "bigint" })
    id!: number;

    @Column({ type: "bigint" })
    @Index()
    creatorId!: number;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
