import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProgramEntity1760528490595 implements MigrationInterface {
    name = 'UpdateProgramEntity1760528490595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programs" ADD "created_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "FK_b44b72ef368c7a57f4777d81b0f" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "FK_b44b72ef368c7a57f4777d81b0f"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "created_by_id"`);
    }

}
