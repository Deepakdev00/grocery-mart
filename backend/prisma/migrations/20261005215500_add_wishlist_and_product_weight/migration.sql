ALTER TABLE "Product" ADD COLUMN "weight" TEXT NOT NULL DEFAULT '';

CREATE TABLE "WishlistItem" (
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("userId", "productId")
);

CREATE INDEX "WishlistItem_userId_createdAt_idx" ON "WishlistItem"("userId", "createdAt");

ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
