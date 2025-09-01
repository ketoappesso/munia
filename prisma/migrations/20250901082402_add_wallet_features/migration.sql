-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "WalletTransaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "email" TEXT,
    "name" TEXT,
    "gender" TEXT,
    "birthDate" DATETIME,
    "phoneNumber" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "relationshipStatus" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "profilePhoto" TEXT,
    "coverPhoto" TEXT,
    "passwordHash" TEXT,
    "walletAddress" TEXT,
    "apeBalance" REAL NOT NULL DEFAULT 0,
    "walletCreatedAt" DATETIME
);
INSERT INTO "new_User" ("address", "bio", "birthDate", "coverPhoto", "email", "emailVerified", "gender", "id", "image", "name", "passwordHash", "phoneNumber", "profilePhoto", "relationshipStatus", "username", "website") SELECT "address", "bio", "birthDate", "coverPhoto", "email", "emailVerified", "gender", "id", "image", "name", "passwordHash", "phoneNumber", "profilePhoto", "relationshipStatus", "username", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_txHash_key" ON "WalletTransaction"("txHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_fromUserId_idx" ON "WalletTransaction"("fromUserId");

-- CreateIndex
CREATE INDEX "WalletTransaction_toUserId_idx" ON "WalletTransaction"("toUserId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
