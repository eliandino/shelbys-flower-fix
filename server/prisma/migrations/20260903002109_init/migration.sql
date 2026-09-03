-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "paymentToken" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "occasion" TEXT,
    "budgetRange" TEXT,
    "favoriteColorsFlowers" TEXT,
    "requestedDate" DATETIME,
    "fulfillmentType" TEXT NOT NULL DEFAULT 'PICKUP',
    "deliveryAddress" TEXT,
    "specialInstructions" TEXT,
    "arrangementPrice" INTEGER,
    "deliveryFee" INTEGER,
    "totalAmount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paymentProvider" TEXT,
    "paymentProviderTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentToken_key" ON "Order"("paymentToken");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
