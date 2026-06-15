-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Required by the exclusion constraint that protects the single agenda.
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CLIENT', 'OWNER');

-- CreateEnum
CREATE TYPE "establishment_status" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_ESTABLISHMENT', 'NO_SHOW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(2048),
    "role" "user_role" NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_normalized_check" CHECK ("email" = lower(trim("email")))
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "logo_url" VARCHAR(2048),
    "cover_url" VARCHAR(2048),
    "status" "establishment_status" NOT NULL DEFAULT 'PENDING',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "address_line" VARCHAR(255) NOT NULL,
    "address_number" VARCHAR(20),
    "address_extra" VARCHAR(120),
    "neighborhood" VARCHAR(120),
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "postal_code" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "establishments_coordinates_pair_check" CHECK (
        ("latitude" IS NULL AND "longitude" IS NULL)
        OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)
    ),
    CONSTRAINT "establishments_latitude_check" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
    CONSTRAINT "establishments_longitude_check" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
    CONSTRAINT "establishments_slug_normalized_check" CHECK ("slug" = lower(trim("slug")))
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(80),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_slug_normalized_check" CHECK ("slug" = lower(trim("slug")))
);

-- CreateTable
CREATE TABLE "establishment_categories" (
    "establishment_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_categories_pkey" PRIMARY KEY ("establishment_id","category_id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "services_price_check" CHECK ("price" >= 0),
    CONSTRAINT "services_duration_minutes_check" CHECK ("duration_minutes" > 0)
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'PENDING',
    "service_name" VARCHAR(120) NOT NULL,
    "service_price" DECIMAL(10,2) NOT NULL,
    "service_duration_minutes" INTEGER NOT NULL,
    "client_notes" VARCHAR(500),
    "cancellation_reason" VARCHAR(500),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointments_period_check" CHECK ("ends_at" > "starts_at"),
    CONSTRAINT "appointments_service_price_check" CHECK ("service_price" >= 0),
    CONSTRAINT "appointments_service_duration_check" CHECK ("service_duration_minutes" > 0),
    CONSTRAINT "appointments_cancellation_check" CHECK (
        (
            "status" IN ('CANCELLED_BY_CLIENT', 'CANCELLED_BY_ESTABLISHMENT')
            AND "cancelled_at" IS NOT NULL
        )
        OR (
            "status" NOT IN ('CANCELLED_BY_CLIENT', 'CANCELLED_BY_ESTABLISHMENT')
            AND "cancelled_at" IS NULL
            AND "cancellation_reason" IS NULL
        )
    )
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","establishment_id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opens_at_minute" SMALLINT NOT NULL,
    "closes_at_minute" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "business_hours_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6),
    CONSTRAINT "business_hours_minutes_check" CHECK (
        "opens_at_minute" BETWEEN 0 AND 1439
        AND "closes_at_minute" BETWEEN 1 AND 1440
        AND "closes_at_minute" > "opens_at_minute"
    )
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "schedule_blocks_period_check" CHECK ("ends_at" > "starts_at")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "establishments_slug_key" ON "establishments"("slug");

-- CreateIndex
CREATE INDEX "establishments_owner_id_idx" ON "establishments"("owner_id");

-- CreateIndex
CREATE INDEX "establishments_status_city_state_idx" ON "establishments"("status", "city", "state");

-- CreateIndex
CREATE INDEX "establishments_coordinates_idx" ON "establishments"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_name_idx" ON "categories"("is_active", "name");

-- CreateIndex
CREATE INDEX "establishment_categories_category_id_idx" ON "establishment_categories"("category_id");

-- CreateIndex
CREATE INDEX "services_establishment_id_is_active_idx" ON "services"("establishment_id", "is_active");

-- CreateIndex
CREATE INDEX "appointments_client_id_starts_at_idx" ON "appointments"("client_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_establishment_id_starts_at_idx" ON "appointments"("establishment_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_establishment_status_starts_at_idx" ON "appointments"("establishment_id", "status", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_service_id_idx" ON "appointments"("service_id");

-- A single-establishment agenda cannot contain overlapping active bookings.
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_active_overlap"
EXCLUDE USING GIST (
    "establishment_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));

-- CreateIndex
CREATE INDEX "favorites_establishment_id_idx" ON "favorites"("establishment_id");

-- CreateIndex
CREATE INDEX "business_hours_establishment_day_idx" ON "business_hours"("establishment_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_establishment_day_opens_key" ON "business_hours"("establishment_id", "day_of_week", "opens_at_minute");

-- CreateIndex
CREATE INDEX "schedule_blocks_establishment_period_idx" ON "schedule_blocks"("establishment_id", "starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_categories" ADD CONSTRAINT "establishment_categories_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_categories" ADD CONSTRAINT "establishment_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
