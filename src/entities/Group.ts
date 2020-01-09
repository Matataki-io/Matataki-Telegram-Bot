import { Entity, PrimaryColumn, ManyToMany, Column, Index } from "typeorm";

import { User } from "./User";
import { GroupRequirement } from "definitions/GroupRequirement";

@Entity()
export class Group {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "bigint" })
    @Index({ where: "active" })
    creatorId!: number | string;

    @Column({ type: "boolean" })
    active!: boolean;

    @Column({ type: "int" })
    @Index({ where: "active" })
    tokenId!: number;

    @Column({ type: "jsonb" })
    requirement!: GroupRequirement;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
