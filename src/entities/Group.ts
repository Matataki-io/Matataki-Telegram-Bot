import { Entity, PrimaryColumn, ManyToMany, Column, Index } from "typeorm";

import { User } from "./User";

@Entity()
export class Group {
    @PrimaryColumn()
    id!: number;

    @Column()
    @Index()
    creatorId!: number;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
