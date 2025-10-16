import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExtConnUniqueFields1760530040394 implements MigrationInterface {
    name = 'UpdateExtConnUniqueFields1760530040394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "external_connections" DROP CONSTRAINT "UQ_44b7d1294dab91b8ab08b4c3153"`);
        await queryRunner.query(`ALTER TABLE "external_connections" ADD CONSTRAINT "UQ_8e9f9024415b46763c40e4cafc6" UNIQUE ("created_by", "name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "external_connections" DROP CONSTRAINT "UQ_8e9f9024415b46763c40e4cafc6"`);
        await queryRunner.query(`ALTER TABLE "external_connections" ADD CONSTRAINT "UQ_44b7d1294dab91b8ab08b4c3153" UNIQUE ("name")`);
    }

}
