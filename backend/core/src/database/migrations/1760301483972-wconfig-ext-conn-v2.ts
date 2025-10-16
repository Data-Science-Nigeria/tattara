import { MigrationInterface, QueryRunner } from 'typeorm';

export class WconfigExtConnV21760301483972 implements MigrationInterface {
  name = 'WconfigExtConnV21760301483972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7" UNIQUE ("external_connection_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
