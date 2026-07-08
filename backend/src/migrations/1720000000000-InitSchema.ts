import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1720000000000 implements MigrationInterface {
  name = 'InitSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Needed for gen_random_uuid(), used as the default for bookings.id
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await queryRunner.query(`
      CREATE TYPE "bookings_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "date" TIMESTAMPTZ NOT NULL,
        "total_seats" int NOT NULL,
        "available_seats" int NOT NULL,
        "price_cents" int NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" varchar NOT NULL,
        "booking_reference" varchar NOT NULL,
        "event_id" int NOT NULL,
        "customer_name" varchar NOT NULL,
        "customer_email" varchar NOT NULL,
        "seats" int NOT NULL,
        "status" "bookings_status_enum" NOT NULL DEFAULT 'PENDING',
        "failure_reason" varchar,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_bookings_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT
      )
    `);

    // The unique constraint on request_id is the actual duplicate-prevention
    // mechanism: even under a race, Postgres allows only one row per value.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_bookings_request_id" ON "bookings" ("request_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_bookings_reference" ON "bookings" ("booking_reference")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_event_id" ON "bookings" ("event_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_status" ON "bookings" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "bookings_status_enum"`);
  }
}
