import { Entity, PrimaryColumn, ManyToMany, Column, Index } from "typeorm";

import { User } from "./User";

@Entity()
export class Group {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @Column({ type: "text" })
    title!: string;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
