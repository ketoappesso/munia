-- CreateTable
CREATE TABLE "FacegateDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "prodType" TEXT,
    "prodName" TEXT,
    "relaySlots" INTEGER NOT NULL DEFAULT 0,
    "lastSeenTs" BIGINT,
    "fwVersion" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "tz" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FacegatePerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "localImagePath" TEXT,
    "imageChecksum" TEXT,
    "icCardId" TEXT,
    "idCardNo" TEXT,
    "memberLevel" TEXT,
    "memberExpiry" DATETIME,
    "isApeLord" BOOLEAN NOT NULL DEFAULT false,
    "passPlans" TEXT,
    "syncStatus" INTEGER NOT NULL DEFAULT 0,
    "extInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacegatePerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacegateRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "recordId" BIGINT NOT NULL,
    "personPhone" TEXT,
    "recordTime" BIGINT NOT NULL,
    "recordType" INTEGER NOT NULL,
    "recordPass" INTEGER NOT NULL,
    "similarity" REAL,
    "temperature" REAL,
    "qrcode" TEXT,
    "healthCodeColor" TEXT,
    "recordPicUrl" TEXT,
    "idCardPicUrl" TEXT,
    "raw" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacegateRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "FacegateDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacegateRecord_personPhone_fkey" FOREIGN KEY ("personPhone") REFERENCES "FacegatePerson" ("phone") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacegateSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userPhone" TEXT NOT NULL,
    "imageId" TEXT,
    "payloadType" TEXT NOT NULL DEFAULT 'image',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "cron" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacegateSchedule_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "FacegateImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacegateImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userPhone" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FacegateScheduleTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "FacegateScheduleTarget_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "FacegateSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacegateScheduleTarget_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "FacegateDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacegateJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacegateJob_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "FacegateSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacegateJob_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "FacegateDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FacegateDevice_deviceId_key" ON "FacegateDevice"("deviceId");

-- CreateIndex
CREATE INDEX "FacegateDevice_deviceId_idx" ON "FacegateDevice"("deviceId");

-- CreateIndex
CREATE INDEX "FacegateDevice_online_idx" ON "FacegateDevice"("online");

-- CreateIndex
CREATE UNIQUE INDEX "FacegatePerson_userId_key" ON "FacegatePerson"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacegatePerson_phone_key" ON "FacegatePerson"("phone");

-- CreateIndex
CREATE INDEX "FacegatePerson_phone_idx" ON "FacegatePerson"("phone");

-- CreateIndex
CREATE INDEX "FacegatePerson_userId_idx" ON "FacegatePerson"("userId");

-- CreateIndex
CREATE INDEX "FacegatePerson_syncStatus_idx" ON "FacegatePerson"("syncStatus");

-- CreateIndex
CREATE INDEX "FacegateRecord_personPhone_idx" ON "FacegateRecord"("personPhone");

-- CreateIndex
CREATE INDEX "FacegateRecord_recordTime_idx" ON "FacegateRecord"("recordTime");

-- CreateIndex
CREATE INDEX "FacegateRecord_deviceId_idx" ON "FacegateRecord"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FacegateRecord_deviceId_recordId_key" ON "FacegateRecord"("deviceId", "recordId");

-- CreateIndex
CREATE INDEX "FacegateSchedule_userPhone_idx" ON "FacegateSchedule"("userPhone");

-- CreateIndex
CREATE INDEX "FacegateSchedule_status_idx" ON "FacegateSchedule"("status");

-- CreateIndex
CREATE INDEX "FacegateSchedule_startAt_endAt_idx" ON "FacegateSchedule"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "FacegateImage_userPhone_idx" ON "FacegateImage"("userPhone");

-- CreateIndex
CREATE INDEX "FacegateScheduleTarget_scheduleId_idx" ON "FacegateScheduleTarget"("scheduleId");

-- CreateIndex
CREATE INDEX "FacegateScheduleTarget_deviceId_idx" ON "FacegateScheduleTarget"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FacegateScheduleTarget_scheduleId_deviceId_key" ON "FacegateScheduleTarget"("scheduleId", "deviceId");

-- CreateIndex
CREATE INDEX "FacegateJob_scheduleId_deviceId_idx" ON "FacegateJob"("scheduleId", "deviceId");

-- CreateIndex
CREATE INDEX "FacegateJob_state_idx" ON "FacegateJob"("state");

-- CreateIndex
CREATE INDEX "FacegateJob_deviceId_idx" ON "FacegateJob"("deviceId");
