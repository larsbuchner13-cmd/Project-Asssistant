-- Backfill: production already had projects before the users/ownerId
-- migration existed. Create a bootstrap admin account, assign every
-- existing ownerless project to it, then make ownerId required.
--
-- The password hash below is a one-way bcrypt hash of a one-time temporary
-- password that was generated and shared out-of-band with the deployment
-- owner. It cannot be reversed from this file.
INSERT INTO "users" ("id", "name", "email", "password", "role", "status", "updatedAt")
VALUES (
    'bootstrap-admin-user',
    'Lars Büchner',
    'larsbuchner13@gmail.com',
    '$2b$12$yD8RLsAGLvxcLZCeKVljme4BKDLzIMAwHJUxZHImwRdNJhkouk9r6',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP
);

-- AlterTable
UPDATE "projects" SET "ownerId" = 'bootstrap-admin-user' WHERE "ownerId" IS NULL;

ALTER TABLE "projects" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
