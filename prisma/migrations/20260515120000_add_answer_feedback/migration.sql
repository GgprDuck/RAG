-- CreateTable
CREATE TABLE "answer_feedback" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "answer_id" VARCHAR(255),
    "feedback_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "score" INTEGER,
    "correction_text" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "answer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "answer_feedback_status_created_at_idx" ON "answer_feedback"("status", "created_at");

-- CreateIndex
CREATE INDEX "answer_feedback_session_id_created_at_idx" ON "answer_feedback"("session_id", "created_at");
