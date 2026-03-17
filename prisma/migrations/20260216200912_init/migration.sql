-- CreateTable
CREATE TABLE "conversation_sessions" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "query" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "embedding" REAL[],
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_sessions_session_id_timestamp_idx" ON "conversation_sessions"("session_id", "timestamp");

-- CreateIndex
CREATE INDEX "conversation_sessions_session_id_idx" ON "conversation_sessions"("session_id");

-- CreateIndex
CREATE INDEX "conversation_sessions_timestamp_idx" ON "conversation_sessions"("timestamp");
