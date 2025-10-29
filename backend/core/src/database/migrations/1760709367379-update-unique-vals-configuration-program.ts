import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUniqueValsConfigurationProgram1760709367379 implements MigrationInterface {
    name = 'UpdateUniqueValsConfigurationProgram1760709367379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "UQ_ba50d0f7b68ee5b73f7e7b8fdf9"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT IF EXISTS "UQ_a911fb2e0cb9ea97b6c39e0708c"`);
        await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "UQ_2aa65f5bdeb56be504334e040cc" UNIQUE ("created_by_id", "name")`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "UQ_d3b3da0f8a78b7248618f657139" UNIQUE ("created_by_id", "name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "UQ_d3b3da0f8a78b7248618f657139"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "UQ_2aa65f5bdeb56be504334e040cc"`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "UQ_a911fb2e0cb9ea97b6c39e0708c" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "UQ_ba50d0f7b68ee5b73f7e7b8fdf9" UNIQUE ("name")`);
    }

}
