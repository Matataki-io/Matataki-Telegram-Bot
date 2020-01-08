import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUpdateTable1578478448505 implements MigrationInterface {
    name = 'AddUpdateTable1578478448505'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`CREATE TABLE "${schema}"."update" ("id" integer NOT NULL, "content" jsonb NOT NULL, CONSTRAINT "update_pkey" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "updates_content_idx" ON "${schema}"."update" USING gin ("content")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`DROP INDEX "${schema}"."updates_content_idx"`, undefined);
        await queryRunner.query(`DROP TABLE "${schema}"."update"`, undefined);
    }

}
