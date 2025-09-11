-- CreateTable
CREATE TABLE "AIProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "llmProvider" TEXT NOT NULL DEFAULT 'deepseek',
    "llmModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "topP" REAL NOT NULL DEFAULT 0.9,
    "systemPrompt" TEXT,
    "roleTemplate" TEXT NOT NULL DEFAULT 'assistant',
    "contextPrompts" TEXT,
    "activeVoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 1.0,
    "metadata" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceTraining" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sampleKeys" TEXT NOT NULL,
    "modelKey" TEXT,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL,
    "trainingStartedAt" DATETIME,
    "trainingCompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoiceTraining_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AIProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AIProfile_userId_key" ON "AIProfile"("userId");

-- CreateIndex
CREATE INDEX "AIMemory_userId_type_category_idx" ON "AIMemory"("userId", "type", "category");

-- CreateIndex
CREATE INDEX "AIMemory_userId_score_idx" ON "AIMemory"("userId", "score");
