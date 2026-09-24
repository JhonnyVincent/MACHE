import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924214334 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_contract" ("id" text not null, "display_id" serial, "title" text not null, "summary" text null, "body" text not null, "version" integer not null default 1, "family" text not null, "content_hash" text null, "status" text check ("status" in ('draft', 'published', 'archived')) not null default 'draft', "published_at" timestamptz null, "published_by" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_contract_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_contract_family" ON "mache_contract" ("family") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_contract_deleted_at" ON "mache_contract" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "mache_contract_signature" ("id" text not null, "display_id" serial, "contract_id" text not null, "contract_version" integer not null, "content_hash" text not null, "contract_title" text not null, "seller_id" text not null, "access_token" text not null, "status" text check ("status" in ('sent', 'viewed', 'signed', 'declined', 'revoked')) not null default 'sent', "sent_at" timestamptz null, "viewed_at" timestamptz null, "signed_at" timestamptz null, "declined_at" timestamptz null, "signer_name" text null, "signer_role" text null, "signer_email" text null, "signer_ip" text null, "signer_user_agent" text null, "decline_reason" text null, "proof_hash" text null, "due_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_contract_signature_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_contract_signature_contract_id" ON "mache_contract_signature" ("contract_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_contract_signature_seller_id" ON "mache_contract_signature" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_contract_signature_deleted_at" ON "mache_contract_signature" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_contract" cascade;`);

    this.addSql(`drop table if exists "mache_contract_signature" cascade;`);
  }

}
