import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUserLanguageColumn1582527122238 implements MigrationInterface {
    name = 'AddUserLanguageColumn1582527122238'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."user" ADD "language" text`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."user" DROP COLUMN "language"`, undefined);
    }

}
