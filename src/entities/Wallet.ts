import { Entity, Column, ManyToOne, PrimaryColumn } from "typeorm";

import { User } from "./User";
import { Tokens } from "../constants";

@Entity()
export class Wallet {
    @ManyToOne(type => User, user => user.wallets, { primary: true })
    user!: User;

    @PrimaryColumn({ type: "enum", enum: Tokens, enumName: "token" })
    token!: Tokens;

    @Column({ type: "text" })
    address!: string;
}
