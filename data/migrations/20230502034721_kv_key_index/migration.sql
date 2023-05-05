-- CreateIndex
CREATE INDEX "KeyValueCache_key_idx" ON "KeyValueCache" USING HASH ("key");
