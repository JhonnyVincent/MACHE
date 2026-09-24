import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924230954 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_thread" ("id" text not null, "display_id" serial, "subject" text not null, "category" text check ("category" in ('question', 'commande', 'boutique', 'signalement', 'autre')) not null default 'question', "from_name" text not null, "from_email" text not null, "from_phone" text null, "customer_id" text null, "seller_id" text null, "access_token" text not null, "status" text check ("status" in ('open', 'answered', 'closed')) not null default 'open', "awaiting_mache" boolean not null default true, "awaiting_sender" boolean not null default false, "last_message_at" timestamptz null, "internal_note" text null, "closed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_thread_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_thread_customer_id" ON "mache_thread" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_thread_seller_id" ON "mache_thread" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_thread_deleted_at" ON "mache_thread" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "mache_thread_message" ("id" text not null, "thread_id" text not null, "author" text check ("author" in ('sender', 'mache')) not null, "author_name" text not null, "body" text not null, "internal" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_thread_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_thread_message_thread_id" ON "mache_thread_message" ("thread_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_thread_message_deleted_at" ON "mache_thread_message" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_thread" cascade;`);

    this.addSql(`drop table if exists "mache_thread_message" cascade;`);
  }

}
