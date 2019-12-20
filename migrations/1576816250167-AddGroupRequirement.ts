import {MigrationInterface, QueryRunner} from "typeorm";

export class AddGroupRequirement1576816250167 implements MigrationInterface {
    name = 'AddGroupRequirement1576816250167'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "group_requirement" ("groupId" bigint NOT NULL, "token" "token" NOT NULL, "amount" bigint NOT NULL, CONSTRAINT "PK_445842340e67eac87f9c04e6924" PRIMARY KEY ("groupId", "token"))`, undefined);
        await queryRunner.query(`ALTER TABLE "group_requirement" ADD CONSTRAINT "FK_0efbc327b775e226ca122cee9c2" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "group_requirement" DROP CONSTRAINT "FK_0efbc327b775e226ca122cee9c2"`, undefined);
        await queryRunner.query(`DROP TABLE "group_requirement"`, undefined);
    }

}
