import {MigrationInterface, QueryRunner} from "typeorm";

export class InactiveGroupByDefault1578560079701 implements MigrationInterface {
    name = 'InactiveGroupByDefault1578560079701'

    public async up(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."group" ALTER COLUMN "active" DROP DEFAULT`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const { options } = queryRunner.connection;
        if (options.type !== "postgres") {
            throw new Error("Require PostgreSQL database");
        }

        const schema = options.schema ?? "public";

        await queryRunner.query(`ALTER TABLE "${schema}"."group" ALTER COLUMN "active" SET DEFAULT true`, undefined);
    }

}
