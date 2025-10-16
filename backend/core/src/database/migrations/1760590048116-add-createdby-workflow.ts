import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedbyWorkflow1760590048116 implements MigrationInterface {
    name = 'AddCreatedbyWorkflow1760590048116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" ADD "created_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_2efdcd3dd18adce22519bb09e66" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_2efdcd3dd18adce22519bb09e66"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "created_by_id"`);
    }

}
