import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUsernameColumn1580894888663 implements MigrationInterface {
    name = 'AddUsernameColumn1580894888663'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."user" ADD "username" text`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."user" ADD CONSTRAINT "user_username_idx" UNIQUE ("username")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."user" DROP CONSTRAINT "user_username_idx"`, undefined);
        await queryRunner.query(`ALTER TABLE "${schema}"."user" DROP COLUMN "username"`, undefined);
    }

}
