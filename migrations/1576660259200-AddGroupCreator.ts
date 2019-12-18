import {MigrationInterface, QueryRunner} from "typeorm";

export class AddGroupCreator1576660259200 implements MigrationInterface {
    name = 'AddGroupCreator1576660259200'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "group" ADD "creatorId" integer NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_35472b1fe48b6330cd349709564" PRIMARY KEY ("userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "token"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD "token" "token" NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_35472b1fe48b6330cd349709564"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc" PRIMARY KEY ("userId", "token")`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_af184d5494395694865868b13c" ON "group" ("creatorId") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_af184d5494395694865868b13c"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_35472b1fe48b6330cd349709564" PRIMARY KEY ("userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "token"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD "token" token NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_35472b1fe48b6330cd349709564"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc" PRIMARY KEY ("token", "userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "creatorId"`, undefined);
    }

}
