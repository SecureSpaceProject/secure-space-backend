import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1766422534104 implements MigrationInterface {
    name = 'InitialMigration1766422534104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."alerts_status_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "event_id" uuid NOT NULL, "closed_by_user_id" uuid, "status" "public"."alerts_status_enum" NOT NULL DEFAULT 'OPEN', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sensor_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "sensor_id" uuid NOT NULL, "triggered" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "alertId" uuid, CONSTRAINT "PK_fbd8b2fc04100ea9b1e617f3551" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sensors_type_enum" AS ENUM('MOTION', 'OPEN')`);
        await queryRunner.query(`CREATE TABLE "sensors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "name" character varying NOT NULL, "type" "public"."sensors_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b8bd5fcfd700e39e96bcd9ba6b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('PENDING', 'SENT', 'READ', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "room_id" uuid NOT NULL, "alert_id" uuid NOT NULL, "message" text NOT NULL, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_action_enum" AS ENUM('ARM_ROOM', 'DISARM_ROOM', 'ADD_SENSOR', 'UPDATE_SENSOR', 'REMOVE_SENSOR', 'SENSOR_TRIGGERED', 'CREATE_ALERT', 'CLOSE_ALERT', 'ADD_MEMBER', 'REMOVE_MEMBER')`);
        await queryRunner.query(`CREATE TYPE "public"."room_activity_log_target_type_enum" AS ENUM('ROOM', 'SENSOR', 'SENSOR_EVENT', 'ALERT', 'USER', 'ROOM_MEMBER', 'NOTIFICATION')`);
        await queryRunner.query(`CREATE TABLE "room_activity_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "actor_user_id" uuid NOT NULL, "action" "public"."room_activity_log_action_enum" NOT NULL, "details" text, "target_type" "public"."room_activity_log_target_type_enum", "target_id" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_5b94ed05d80d9c306ceb962bec" CHECK (("target_type" IS NULL AND "target_id" IS NULL) OR ("target_type" IS NOT NULL AND "target_id" IS NOT NULL)), CONSTRAINT "PK_921e6768ec8d4cb6eaf49c693bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "is_armed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."room_members_member_role_enum" AS ENUM('OWNER', 'ADMIN', 'USER', 'DEFAULT')`);
        await queryRunner.query(`CREATE TABLE "room_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "user_id" uuid NOT NULL, "member_role" "public"."room_members_member_role_enum" NOT NULL DEFAULT 'DEFAULT', "added_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d4ea360161fd5ff21a94ae9d8a6" UNIQUE ("room_id", "user_id"), CONSTRAINT "PK_4493fab0433f741b7cf842e6038" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_6db8373fed57e269836a5dd80db" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_742ec1fb813553d4b92de02840b" FOREIGN KEY ("event_id") REFERENCES "sensor_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_b837499b83cfe63b7de9ce7ca9b" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD CONSTRAINT "FK_06df8ac59586c5e3dec380507d3" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD CONSTRAINT "FK_aa7107c926dff701abbaf53aa87" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD CONSTRAINT "FK_2892a8479da51de73c65ceee6e9" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD CONSTRAINT "FK_33a7f2188ca53eedce77866a8d9" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_a722fcbcb0708840a5eae925c44" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9589e72e51c4f089bb9655d3273" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ADD CONSTRAINT "FK_79b71d923b6203d563f9ea0c185" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" ADD CONSTRAINT "FK_c54243571cd0244d658bc604178" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_members" ADD CONSTRAINT "FK_e6cf45f179a524427ddf8bacd8e" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_members" ADD CONSTRAINT "FK_b2d15baf5b46ed9659bd71fbb43" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room_members" DROP CONSTRAINT "FK_b2d15baf5b46ed9659bd71fbb43"`);
        await queryRunner.query(`ALTER TABLE "room_members" DROP CONSTRAINT "FK_e6cf45f179a524427ddf8bacd8e"`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" DROP CONSTRAINT "FK_c54243571cd0244d658bc604178"`);
        await queryRunner.query(`ALTER TABLE "room_activity_log" DROP CONSTRAINT "FK_79b71d923b6203d563f9ea0c185"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9589e72e51c4f089bb9655d3273"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_a722fcbcb0708840a5eae925c44"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP CONSTRAINT "FK_33a7f2188ca53eedce77866a8d9"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP CONSTRAINT "FK_2892a8479da51de73c65ceee6e9"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP CONSTRAINT "FK_aa7107c926dff701abbaf53aa87"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP CONSTRAINT "FK_06df8ac59586c5e3dec380507d3"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_b837499b83cfe63b7de9ce7ca9b"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_742ec1fb813553d4b92de02840b"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_6db8373fed57e269836a5dd80db"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "room_members"`);
        await queryRunner.query(`DROP TYPE "public"."room_members_member_role_enum"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "room_activity_log"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."room_activity_log_action_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TABLE "sensors"`);
        await queryRunner.query(`DROP TYPE "public"."sensors_type_enum"`);
        await queryRunner.query(`DROP TABLE "sensor_events"`);
        await queryRunner.query(`DROP TABLE "alerts"`);
        await queryRunner.query(`DROP TYPE "public"."alerts_status_enum"`);
    }

}
