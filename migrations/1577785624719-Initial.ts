import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1577785624719 implements MigrationInterface {
    name = 'Initial1577785624719'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`CREATE TABLE "${schema}"."user" ("id" bigint NOT NULL, CONSTRAINT "user_pkey" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "${schema}"."group" ("id" bigint NOT NULL, "title" text NOT NULL, "creatorId" bigint NOT NULL, "active" boolean NOT NULL DEFAULT true, "tokenId" integer NOT NULL, "requirement" jsonb NOT NULL, CONSTRAINT "group_pkey" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "group_creatorId_idx" ON "${schema}"."group" ("creatorId") WHERE active`, undefined);
        await queryRunner.query(`CREATE INDEX "group_tokenId_idx" ON "${schema}"."group" ("tokenId") WHERE active`, undefined);
        await queryRunner.query(`CREATE TABLE "${schema}"."metadata" ("name" text NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "metadata_pkey" PRIMARY KEY ("name"))`, undefined);
        await queryRunner.query(`CREATE TABLE "${schema}"."group_member" ("userId" bigint NOT NULL, "groupId" bigint NOT NULL, CONSTRAINT "group_member_pkey" PRIMARY KEY ("userId", "groupId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "group_member_userId_idx" ON "${schema}"."group_member" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "group_member_groupId_idx" ON "${schema}"."group_member" ("groupId") `, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group_member" ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "${schema}"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "${schema}"."group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."group_member" DROP CONSTRAINT "group_member_groupId_fkey"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group_member" DROP CONSTRAINT "group_member_userId_fkey"`, undefined);
        await queryRunner.query(`DROP INDEX "${schema}"."group_member_groupId_idx"`, undefined);
        await queryRunner.query(`DROP INDEX "${schema}"."group_member_userId_idx"`, undefined);
        await queryRunner.query(`DROP TABLE "${schema}"."group_member"`, undefined);
        await queryRunner.query(`DROP TABLE "${schema}"."metadata"`, undefined);
        await queryRunner.query(`DROP INDEX "${schema}"."group_tokenId_idx"`, undefined);
        await queryRunner.query(`DROP INDEX "${schema}"."group_creatorId_idx"`, undefined);
        await queryRunner.query(`DROP TABLE "${schema}"."group"`, undefined);
        await queryRunner.query(`DROP TABLE "${schema}"."user"`, undefined);
    }

}
