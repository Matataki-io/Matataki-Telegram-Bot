import { Entity, PrimaryColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";

import { Wallet } from "./Wallet";
import { Group } from "./Group";

@Entity()
export class User {
    @PrimaryColumn({ type: "bigint" })
    id!: number;

    @OneToMany(type => Wallet, wallet => wallet.user)
    wallets!: Wallet[];

    @ManyToMany(type => Group, group => group.members)
    @JoinTable({ name: "group_member" })
    groups!: Group[];
}
