-- AlterTable User: Add isBlocked and deletedAt fields
ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable DriverProfile: Add vehicleType and totalEarnings
ALTER TABLE "DriverProfile" ADD COLUMN "vehicleType" TEXT NOT NULL DEFAULT 'ECONOMY';
ALTER TABLE "DriverProfile" ADD COLUMN "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable RefreshToken
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex User indexes
CREATE INDEX "User_role_isBlocked_idx" ON "User"("role", "isBlocked");

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex Ride indexes
CREATE INDEX "Ride_passengerId_status_idx" ON "Ride"("passengerId", "status");

CREATE INDEX "Ride_driverId_status_idx" ON "Ride"("driverId", "status");

CREATE INDEX "Ride_status_requestedAt_idx" ON "Ride"("status", "requestedAt");

CREATE INDEX "Ride_status_createdAt_idx" ON "Ride"("status", "createdAt");

-- CreateIndex DriverProfile indexes
CREATE INDEX "DriverProfile_isVerified_isAvailable_idx" ON "DriverProfile"("isVerified", "isAvailable");

CREATE INDEX "DriverProfile_currentLatitude_currentLongitude_idx" ON "DriverProfile"("currentLatitude", "currentLongitude");

-- CreateIndex PromoCode indexes
CREATE INDEX "PromoCode_isActive_validFrom_validUntil_idx" ON "PromoCode"("isActive", "validFrom", "validUntil");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
