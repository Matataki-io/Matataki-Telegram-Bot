import { Entity, PrimaryColumn, ManyToMany, Column, Index, OneToMany } from "typeorm";

import { User } from "./User";
import { GroupRequirement } from "./GroupRequirement";

@Entity()
export class Group {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @Column({ type: "bigint" })
    @Index()
    creatorId!: number | string;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];

    @OneToMany(type => GroupRequirement, requirement => requirement.group)
    requirements!: GroupRequirement[];
}
