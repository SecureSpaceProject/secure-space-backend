import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEnumsForLogs1766780510763 implements MigrationInterface {
    name = 'ChangeEnumsForLogs1766780510763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."room_activity_log_action_enum" RENAME TO "room_activity_log_action_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_action_enum" AS ENUM('CREATE_ROOM', 'UPDATE_ROOM', 'ARM_ROOM', 'DISARM_ROOM', 'ADD_SENSOR', 'UPDATE_SENSOR', 'REMOVE_SENSOR', 'ADD_MEMBER', 'REMOVE_MEMBER', 'UPDATE_MEMBER_ROLE', 'CREATE_ALERT', 'CLOSE_ALERT', 'DISABLE_ALERT')`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ALTER COLUMN "action" TYPE "public"."room_activity_log_action_enum" USING "action"::"text"::"public"."room_activity_log_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_action_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."room_activity_log_target_type_enum" RENAME TO "room_activity_log_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_target_type_enum" AS ENUM('ROOM', 'SENSOR', 'USER', 'ROOM_MEMBER', 'ALERT')`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ALTER COLUMN "target_type" TYPE "public"."room_activity_log_target_type_enum" USING "target_type"::"text"::"public"."room_activity_log_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_target_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_target_type_enum_old" AS ENUM('ROOM', 'SENSOR', 'SENSOR_EVENT', 'ALERT', 'USER', 'ROOM_MEMBER', 'NOTIFICATION')`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ALTER COLUMN "target_type" TYPE "public"."room_activity_log_target_type_enum_old" USING "target_type"::"text"::"public"."room_activity_log_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."room_activity_log_target_type_enum_old" RENAME TO "room_activity_log_target_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_action_enum_old" AS ENUM('ARM_ROOM', 'DISARM_ROOM', 'ADD_SENSOR', 'UPDATE_SENSOR', 'REMOVE_SENSOR', 'SENSOR_TRIGGERED', 'CREATE_ALERT', 'CLOSE_ALERT', 'ADD_MEMBER', 'REMOVE_MEMBER')`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ALTER COLUMN "action" TYPE "public"."room_activity_log_action_enum_old" USING "action"::"text"::"public"."room_activity_log_action_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_action_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."room_activity_log_action_enum_old" RENAME TO "room_activity_log_action_enum"`);
    }

}
