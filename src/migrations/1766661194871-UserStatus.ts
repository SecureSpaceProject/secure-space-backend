import { MigrationInterface, QueryRunner } from "typeorm";

export class UserStatus1766661194871 implements MigrationInterface {
    name = 'UserStatus1766661194871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'BLOCKED')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    }

}
