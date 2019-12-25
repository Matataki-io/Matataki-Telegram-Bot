import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1577267495343 implements MigrationInterface {
    name = 'Initial1577267495343'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user" ("id" bigint NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "group" ("id" bigint NOT NULL, "creatorId" bigint NOT NULL, "active" boolean NOT NULL DEFAULT true, "tokenId" integer NOT NULL, "requirement" jsonb NOT NULL, CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_af184d5494395694865868b13c" ON "group" ("creatorId") `, undefined);
        await queryRunner.query(`CREATE TABLE "group_member" ("userId" bigint NOT NULL, "groupId" bigint NOT NULL, CONSTRAINT "PK_0b4af14c22502d5f24bf2a89bd2" PRIMARY KEY ("userId", "groupId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9f209c217eef89b8c32bd07790" ON "group_member" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_44c8964c097cf7f71434d6d112" ON "group_member" ("groupId") `, undefined);
        await queryRunner.query(`ALTER TABLE "group_member" ADD CONSTRAINT "FK_9f209c217eef89b8c32bd077903" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "group_member" ADD CONSTRAINT "FK_44c8964c097cf7f71434d6d1122" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "group_member" DROP CONSTRAINT "FK_44c8964c097cf7f71434d6d1122"`, undefined);
        await queryRunner.query(`ALTER TABLE "group_member" DROP CONSTRAINT "FK_9f209c217eef89b8c32bd077903"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_44c8964c097cf7f71434d6d112"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9f209c217eef89b8c32bd07790"`, undefined);
        await queryRunner.query(`DROP TABLE "group_member"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_af184d5494395694865868b13c"`, undefined);
        await queryRunner.query(`DROP TABLE "group"`, undefined);
        await queryRunner.query(`DROP TABLE "user"`, undefined);
    }

}
