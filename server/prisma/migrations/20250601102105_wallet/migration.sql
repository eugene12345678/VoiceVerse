-- AlterTable
ALTER TABLE `NFT` ADD COLUMN `assetId` INTEGER NULL,
    ADD COLUMN `blockchainStatus` VARCHAR(191) NULL,
    ADD COLUMN `metadata` TEXT NULL;

-- CreateTable
CREATE TABLE `AlgorandWallet` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AlgorandWallet_userId_key`(`userId`),
    UNIQUE INDEX `AlgorandWallet_address_key`(`address`),
    INDEX `AlgorandWallet_address_idx`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlgorandTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `nftId` VARCHAR(191) NOT NULL,
    `type` ENUM('MINT', 'TRANSFER', 'SALE', 'ROYALTY') NOT NULL,
    `fromAddress` VARCHAR(191) NOT NULL,
    `toAddress` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL,
    `transactionHash` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `AlgorandTransaction_nftId_idx`(`nftId`),
    INDEX `AlgorandTransaction_fromAddress_idx`(`fromAddress`),
    INDEX `AlgorandTransaction_toAddress_idx`(`toAddress`),
    INDEX `AlgorandTransaction_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NFTMarketplaceListing` (
    `id` VARCHAR(191) NOT NULL,
    `nftId` VARCHAR(191) NOT NULL,
    `sellerId` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SOLD', 'CANCELLED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `NFTMarketplaceListing_nftId_idx`(`nftId`),
    INDEX `NFTMarketplaceListing_sellerId_idx`(`sellerId`),
    INDEX `NFTMarketplaceListing_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `NFT_assetId_idx` ON `NFT`(`assetId`);

-- AddForeignKey
ALTER TABLE `AlgorandWallet` ADD CONSTRAINT `AlgorandWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlgorandTransaction` ADD CONSTRAINT `AlgorandTransaction_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `NFT`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NFTMarketplaceListing` ADD CONSTRAINT `NFTMarketplaceListing_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `NFT`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NFTMarketplaceListing` ADD CONSTRAINT `NFTMarketplaceListing_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
