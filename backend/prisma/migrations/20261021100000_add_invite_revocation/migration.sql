ALTER TABLE "Invite" ADD COLUMN "revokedAt" TIMESTAMP(3);

DROP INDEX "Invite_expiresAt_usedAt_idx";
CREATE INDEX "Invite_expiresAt_usedAt_revokedAt_idx" ON "Invite"("expiresAt", "usedAt", "revokedAt");
