import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramsUsers1759152085958 implements MigrationInterface {
  name = 'ProgramsUsers1759152085958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_programs" ("user_id" uuid NOT NULL, "program_id" uuid NOT NULL, CONSTRAINT "PK_0516782665f5f4b7376c58c1289" PRIMARY KEY ("user_id", "program_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b122692056ea2a51c7c11c014b" ON "user_programs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64c67a08a39440a318a005fbae" ON "user_programs" ("program_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" ADD CONSTRAINT "FK_b122692056ea2a51c7c11c014b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" ADD CONSTRAINT "FK_64c67a08a39440a318a005fbaea" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_programs" DROP CONSTRAINT "FK_64c67a08a39440a318a005fbaea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" DROP CONSTRAINT "FK_b122692056ea2a51c7c11c014b4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64c67a08a39440a318a005fbae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b122692056ea2a51c7c11c014b"`,
    );
    await queryRunner.query(`DROP TABLE "user_programs"`);
  }
}
