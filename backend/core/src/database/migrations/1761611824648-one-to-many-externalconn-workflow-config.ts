import { MigrationInterface, QueryRunner } from "typeorm";

export class OneToManyExternalconnWorkflowConfig1761611824648 implements MigrationInterface {
    name = 'OneToManyExternalconnWorkflowConfig1761611824648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`);
        await queryRunner.query(`ALTER TABLE "workflow_configurations" DROP CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7"`);
        await queryRunner.query(`ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`);
        await queryRunner.query(`ALTER TABLE "workflow_configurations" ADD CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7" UNIQUE ("external_connection_id")`);
        await queryRunner.query(`ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
