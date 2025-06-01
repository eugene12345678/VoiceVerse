-- AlterTable
ALTER TABLE `NFT` ADD COLUMN `duration` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `NFTTag` (
    `id` VARCHAR(191) NOT NULL,
    `nftId` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,

    INDEX `NFTTag_nftId_idx`(`nftId`),
    INDEX `NFTTag_tag_idx`(`tag`),
    UNIQUE INDEX `NFTTag_nftId_tag_key`(`nftId`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NFTTag` ADD CONSTRAINT `NFTTag_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `NFT`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
