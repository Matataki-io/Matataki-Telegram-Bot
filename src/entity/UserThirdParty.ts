import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class UserThirdParty {
    @PrimaryColumn()
    uid!: number;

    @Column()
    platform!: string;

    @Column({ name: "platform_id", nullable: true, type: "varchar" })
    platformId?: string | null;

    @Column({ name: "challenge_text", nullable: true, type: "varchar" })
    challengeText?: string | null;
}