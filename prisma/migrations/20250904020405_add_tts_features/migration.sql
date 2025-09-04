-- AlterTable
ALTER TABLE "Post" ADD COLUMN "audioUrl" TEXT;

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
    "walletCreatedAt" DATETIME,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "ttsModelId" TEXT,
    "ttsVoiceId" TEXT
);
INSERT INTO "new_User" ("address", "apeBalance", "bio", "birthDate", "coverPhoto", "email", "emailVerified", "gender", "id", "image", "name", "passwordHash", "phoneNumber", "profilePhoto", "relationshipStatus", "username", "walletAddress", "walletCreatedAt", "website") SELECT "address", "apeBalance", "bio", "birthDate", "coverPhoto", "email", "emailVerified", "gender", "id", "image", "name", "passwordHash", "phoneNumber", "profilePhoto", "relationshipStatus", "username", "walletAddress", "walletCreatedAt", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
