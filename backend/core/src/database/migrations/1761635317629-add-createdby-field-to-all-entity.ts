import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedbyFieldToAllEntity1761635317629
  implements MigrationInterface
{
  name = 'AddCreatedbyFieldToAllEntity1761635317629';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD "created_by_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "files" ADD "created_by_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" ADD "created_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD "created_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "FK_a3ac24401afa538b48c002a5c4d" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_56bb34e9a86bf782fef80d8a868" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" ADD CONSTRAINT "FK_1b3497248cd3b3141e993cad054" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_1a6c5181db86434c6ac19fdfdd0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_1a6c5181db86434c6ac19fdfdd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" DROP CONSTRAINT "FK_1b3497248cd3b3141e993cad054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_56bb34e9a86bf782fef80d8a868"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "FK_a3ac24401afa538b48c002a5c4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP COLUMN "created_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" DROP COLUMN "created_by_id"`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "created_by_id"`);
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP COLUMN "created_by_id"`,
    );
  }
}
