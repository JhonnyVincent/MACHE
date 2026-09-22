import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260922123840 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_quote" ("id" text not null, "display_id" serial, "seller_id" text not null, "customer_id" text null, "access_token" text not null, "buyer_name" text not null, "buyer_email" text not null, "buyer_phone" text null, "buyer_company" text null, "product_id" text null, "variant_id" text null, "product_title" text not null, "quantity" integer not null, "message" text null, "status" text check ("status" in ('pending', 'answered', 'accepted', 'declined', 'expired')) not null default 'pending', "seller_message" text null, "quoted_amount" numeric null, "currency_code" text null, "valid_until" timestamptz null, "raw_quoted_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_quote_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_quote_seller_id" ON "mache_quote" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_quote_deleted_at" ON "mache_quote" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_quote" cascade;`);
  }

}
