import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFandomGroupRequirementTable1583391289338 implements MigrationInterface {
    name = 'AddFandomGroupRequirementTable1583391289338'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`DROP INDEX "${schema}"."group_creatorId_idx"`, undefined);
        await queryRunner.query(`DROP INDEX "${schema}"."group_tokenId_idx"`, undefined);
        await queryRunner.query(`CREATE TABLE "${schema}"."fandom_group_requirement" ("minetokenId" integer NOT NULL, "amount" bigint NOT NULL, "amountCanEqual" boolean NOT NULL, "groupId" bigint NOT NULL, CONSTRAINT "fandom_group_requirement_pkey" PRIMARY KEY ("minetokenId", "groupId"))`, undefined);
        await queryRunner.query(`INSERT INTO "${schema}"."fandom_group_requirement" SELECT "group"."tokenId", ("group".requirement->'minetoken'->'amount')::int * 10000, ("group".requirement->'minetoken'->'canEqual')::boolean, "group".id FROM "${schema}"."group" WHERE "group".active AND "group".requirement != '{}'`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group" DROP COLUMN "creatorId"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group" DROP COLUMN "active"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group" DROP COLUMN "tokenId"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."group" DROP COLUMN "requirement"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."fandom_group_requirement" ADD CONSTRAINT "fandom_group_requirement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "${schema}"."group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        throw new Error("Cannot revert");
    }

}
