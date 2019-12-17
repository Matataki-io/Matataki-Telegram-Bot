import { Entity, PrimaryColumn, ManyToMany } from "typeorm";

import { User } from "./User";

@Entity()
export class Group {
    @PrimaryColumn()
    id!: number;

    @ManyToMany(type => User, user => user.groups)
    members!: User[];
}
