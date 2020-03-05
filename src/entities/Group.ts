import { Entity, PrimaryColumn, ManyToMany, Column, Index, OneToMany } from "typeorm";

import { User } from "./User";
import { FandomGroupRequirement } from "./FandomGroupRequirement";

@Entity()
export class Group {
    @PrimaryColumn({ type: "bigint" })
    id!: number | string;

    @Column({ type: "text" })
    title!: string;

    @ManyToMany(() => User, user => user.groups)
    members!: Array<User>;

    @OneToMany(() => FandomGroupRequirement, requirement => requirement.group)
    requirements!: Array<FandomGroupRequirement>;
}
