import { Entity, PrimaryColumn, ManyToMany, Column, Index } from "typeorm";

import { User } from "./User";
import { JsonColumn } from "#/decorators";
import { GroupRequirement } from "#/definitions";

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

    @JsonColumn()
    requirement!: GroupRequirement;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
