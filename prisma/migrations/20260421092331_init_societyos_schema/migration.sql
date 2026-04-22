-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('RESIDENT', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "flat_status" AS ENUM ('OCCUPIED', 'VACANT', 'UNDER_RENOVATION');

-- CreateEnum
CREATE TYPE "bill_status" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'ONLINE');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "complaint_status" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "complaint_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "complaint_category" AS ENUM ('PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'LIFT', 'PARKING', 'NOISE', 'INTERNET', 'GAS', 'OTHER');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('MAINTENANCE', 'SECURITY', 'CLEANING', 'ELECTRICITY', 'WATER', 'LIFT', 'GARDEN', 'INSURANCE', 'LEGAL', 'ADMINISTRATIVE', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "expense_status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "poll_status" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "notice_category" AS ENUM ('GENERAL', 'MAINTENANCE', 'MEETING', 'EMERGENCY', 'FINANCIAL', 'LEGAL', 'EVENT');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "visitor_status" AS ENUM ('ACTIVE', 'EXPIRED', 'USED', 'CANCELLED');

-- CreateTable
CREATE TABLE "societies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "registration_no" VARCHAR(100),
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "total_flats" INTEGER NOT NULL DEFAULT 0,
    "total_floors" INTEGER NOT NULL DEFAULT 0,
    "total_wings" INTEGER NOT NULL DEFAULT 1,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "flat_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "full_name" VARCHAR(200) NOT NULL,
    "avatar_url" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'RESIDENT',
    "status" "user_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_owner" BOOLEAN NOT NULL DEFAULT true,
    "move_in_date" DATE,
    "move_out_date" DATE,
    "last_login_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flats" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "flat_number" VARCHAR(20) NOT NULL,
    "floor" INTEGER NOT NULL,
    "wing" VARCHAR(10),
    "area_sqft" DECIMAL(8,2),
    "bedrooms" INTEGER,
    "status" "flat_status" NOT NULL DEFAULT 'OCCUPIED',
    "monthly_amount" DECIMAL(10,2) NOT NULL,
    "is_commercial" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "flats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "flat_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bill_number" VARCHAR(50) NOT NULL,
    "billing_month" INTEGER NOT NULL,
    "billing_year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "late_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "bill_status" NOT NULL DEFAULT 'PENDING',
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "upi_link" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "transaction_id" VARCHAR(255),
    "upi_ref_number" VARCHAR(255),
    "payment_screenshot" TEXT,
    "payment_date" DATE NOT NULL,
    "confirmed_at" TIMESTAMPTZ,
    "confirmed_by" UUID,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "category" "expense_category" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "vendor_name" VARCHAR(200),
    "vendor_contact" VARCHAR(100),
    "receipt_url" TEXT,
    "status" "expense_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "added_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "raised_by" UUID NOT NULL,
    "assigned_to" UUID,
    "complaint_number" VARCHAR(50) NOT NULL,
    "category" "complaint_category" NOT NULL,
    "priority" "complaint_priority" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "complaint_status" NOT NULL DEFAULT 'OPEN',
    "image_urls" TEXT[],
    "location" VARCHAR(200),
    "expected_by" DATE,
    "resolved_at" TIMESTAMPTZ,
    "resolution_notes" TEXT,
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_updates" (
    "id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "old_status" "complaint_status" NOT NULL,
    "new_status" "complaint_status" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "poll_status" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "option_text" VARCHAR(300) NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "flat_id" UUID NOT NULL,
    "vote_hash" VARCHAR(64) NOT NULL,
    "voted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "category" "notice_category" NOT NULL DEFAULT 'GENERAL',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "attachment_url" TEXT,
    "expires_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_views" (
    "id" UUID NOT NULL,
    "notice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "location" VARCHAR(200),
    "image_url" TEXT,
    "booking_price" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "slot_duration_min" INTEGER NOT NULL DEFAULT 60,
    "open_time" VARCHAR(5) NOT NULL,
    "close_time" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "advance_days" INTEGER NOT NULL DEFAULT 7,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "purpose" VARCHAR(300),
    "attendees" INTEGER,
    "amount_charged" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "host_user_id" UUID NOT NULL,
    "visitor_name" VARCHAR(200) NOT NULL,
    "visitor_phone" VARCHAR(20) NOT NULL,
    "purpose" VARCHAR(300),
    "otp_code" VARCHAR(10) NOT NULL,
    "otp_hash" VARCHAR(64) NOT NULL,
    "status" "visitor_status" NOT NULL DEFAULT 'ACTIVE',
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "checked_in_at" TIMESTAMPTZ,
    "checked_out_at" TIMESTAMPTZ,
    "guard_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "device_info" VARCHAR(500),
    "ip_address" VARCHAR(50),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "society_id" UUID,
    "user_id" UUID,
    "action" "audit_action" NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(100),
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "societies_registration_no_key" ON "societies"("registration_no");

-- CreateIndex
CREATE INDEX "societies_is_active_idx" ON "societies"("is_active");

-- CreateIndex
CREATE INDEX "users_society_id_idx" ON "users"("society_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_society_id_role_idx" ON "users"("society_id", "role");

-- CreateIndex
CREATE INDEX "users_society_id_status_idx" ON "users"("society_id", "status");

-- CreateIndex
CREATE INDEX "users_flat_id_idx" ON "users"("flat_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_society_id_email_key" ON "users"("society_id", "email");

-- CreateIndex
CREATE INDEX "flats_society_id_idx" ON "flats"("society_id");

-- CreateIndex
CREATE INDEX "flats_society_id_status_idx" ON "flats"("society_id", "status");

-- CreateIndex
CREATE INDEX "flats_society_id_wing_idx" ON "flats"("society_id", "wing");

-- CreateIndex
CREATE UNIQUE INDEX "flats_society_id_flat_number_key" ON "flats"("society_id", "flat_number");

-- CreateIndex
CREATE INDEX "bills_society_id_idx" ON "bills"("society_id");

-- CreateIndex
CREATE INDEX "bills_society_id_status_idx" ON "bills"("society_id", "status");

-- CreateIndex
CREATE INDEX "bills_society_id_due_date_idx" ON "bills"("society_id", "due_date");

-- CreateIndex
CREATE INDEX "bills_flat_id_idx" ON "bills"("flat_id");

-- CreateIndex
CREATE INDEX "bills_user_id_idx" ON "bills"("user_id");

-- CreateIndex
CREATE INDEX "bills_billing_month_billing_year_idx" ON "bills"("billing_month", "billing_year");

-- CreateIndex
CREATE UNIQUE INDEX "bills_society_id_flat_id_billing_month_billing_year_key" ON "bills"("society_id", "flat_id", "billing_month", "billing_year");

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "payments_society_id_idx" ON "payments"("society_id");

-- CreateIndex
CREATE INDEX "payments_bill_id_idx" ON "payments"("bill_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "expenses_society_id_idx" ON "expenses"("society_id");

-- CreateIndex
CREATE INDEX "expenses_society_id_status_idx" ON "expenses"("society_id", "status");

-- CreateIndex
CREATE INDEX "expenses_society_id_category_idx" ON "expenses"("society_id", "category");

-- CreateIndex
CREATE INDEX "expenses_society_id_expense_date_idx" ON "expenses"("society_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_added_by_idx" ON "expenses"("added_by");

-- CreateIndex
CREATE INDEX "complaints_society_id_idx" ON "complaints"("society_id");

-- CreateIndex
CREATE INDEX "complaints_society_id_status_idx" ON "complaints"("society_id", "status");

-- CreateIndex
CREATE INDEX "complaints_society_id_priority_idx" ON "complaints"("society_id", "priority");

-- CreateIndex
CREATE INDEX "complaints_society_id_category_idx" ON "complaints"("society_id", "category");

-- CreateIndex
CREATE INDEX "complaints_raised_by_idx" ON "complaints"("raised_by");

-- CreateIndex
CREATE INDEX "complaints_assigned_to_idx" ON "complaints"("assigned_to");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaint_number_key" ON "complaints"("complaint_number");

-- CreateIndex
CREATE INDEX "complaint_updates_complaint_id_idx" ON "complaint_updates"("complaint_id");

-- CreateIndex
CREATE INDEX "polls_society_id_idx" ON "polls"("society_id");

-- CreateIndex
CREATE INDEX "polls_society_id_status_idx" ON "polls"("society_id", "status");

-- CreateIndex
CREATE INDEX "polls_ends_at_idx" ON "polls"("ends_at");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes"("poll_id");

-- CreateIndex
CREATE INDEX "votes_user_id_idx" ON "votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_poll_id_flat_id_key" ON "votes"("poll_id", "flat_id");

-- CreateIndex
CREATE INDEX "notices_society_id_idx" ON "notices"("society_id");

-- CreateIndex
CREATE INDEX "notices_society_id_category_idx" ON "notices"("society_id", "category");

-- CreateIndex
CREATE INDEX "notices_society_id_is_pinned_idx" ON "notices"("society_id", "is_pinned");

-- CreateIndex
CREATE INDEX "notices_created_at_idx" ON "notices"("created_at");

-- CreateIndex
CREATE INDEX "notice_views_notice_id_idx" ON "notice_views"("notice_id");

-- CreateIndex
CREATE INDEX "notice_views_user_id_idx" ON "notice_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notice_views_notice_id_user_id_key" ON "notice_views"("notice_id", "user_id");

-- CreateIndex
CREATE INDEX "amenities_society_id_idx" ON "amenities"("society_id");

-- CreateIndex
CREATE INDEX "amenities_society_id_is_active_idx" ON "amenities"("society_id", "is_active");

-- CreateIndex
CREATE INDEX "bookings_society_id_idx" ON "bookings"("society_id");

-- CreateIndex
CREATE INDEX "bookings_amenity_id_booking_date_idx" ON "bookings"("amenity_id", "booking_date");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_amenity_id_booking_date_start_time_key" ON "bookings"("amenity_id", "booking_date", "start_time");

-- CreateIndex
CREATE INDEX "visitors_society_id_idx" ON "visitors"("society_id");

-- CreateIndex
CREATE INDEX "visitors_otp_code_idx" ON "visitors"("otp_code");

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitors_valid_until_idx" ON "visitors"("valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_society_id_idx" ON "audit_logs"("society_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flats" ADD CONSTRAINT "flats_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_updates" ADD CONSTRAINT "complaint_updates_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_views" ADD CONSTRAINT "notice_views_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_views" ADD CONSTRAINT "notice_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
