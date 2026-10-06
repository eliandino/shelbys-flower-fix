-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'QUOTED', 'AWAITING_PAYMENT', 'PAID', 'DESIGNING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "paymentToken" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "occasion" TEXT,
    "budgetRange" TEXT,
    "favoriteColorsFlowers" TEXT,
    "requestedDate" TIMESTAMP(3),
    "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP',
    "deliveryAddress" TEXT,
    "specialInstructions" TEXT,
    "arrangementPrice" INTEGER,
    "deliveryFee" INTEGER,
    "totalAmount" INTEGER,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paymentProvider" TEXT,
    "paymentProviderTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentToken_key" ON "Order"("paymentToken");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

