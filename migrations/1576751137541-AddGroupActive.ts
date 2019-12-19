import {MigrationInterface, QueryRunner} from "typeorm";

export class AddGroupActive1576751137541 implements MigrationInterface {
    name = 'AddGroupActive1576751137541'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "group" ADD "active" boolean NOT NULL DEFAULT true`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_35472b1fe48b6330cd349709564" PRIMARY KEY ("userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "token"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD "token" "token" NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_35472b1fe48b6330cd349709564"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc" PRIMARY KEY ("userId", "token")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_35472b1fe48b6330cd349709564" PRIMARY KEY ("userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "token"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD "token" token NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "PK_35472b1fe48b6330cd349709564"`, undefined);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "PK_bffe4b5de2ad14a14ae21edd7fc" PRIMARY KEY ("token", "userId")`, undefined);
        await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "active"`, undefined);
    }

}
