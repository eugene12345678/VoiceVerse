-- CreateTable
CREATE TABLE `SavedVoiceCreation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `originalAudioId` VARCHAR(191) NOT NULL,
    `transformedAudioId` VARCHAR(191) NULL,
    `effectId` VARCHAR(191) NULL,
    `effectName` VARCHAR(191) NULL,
    `effectCategory` VARCHAR(191) NULL,
    `settings` LONGTEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `tags` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedVoiceCreation_userId_idx`(`userId`),
    INDEX `SavedVoiceCreation_originalAudioId_idx`(`originalAudioId`),
    INDEX `SavedVoiceCreation_transformedAudioId_idx`(`transformedAudioId`),
    INDEX `SavedVoiceCreation_effectCategory_idx`(`effectCategory`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SavedVoiceCreation` ADD CONSTRAINT `SavedVoiceCreation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedVoiceCreation` ADD CONSTRAINT `SavedVoiceCreation_originalAudioId_fkey` FOREIGN KEY (`originalAudioId`) REFERENCES `AudioFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedVoiceCreation` ADD CONSTRAINT `SavedVoiceCreation_transformedAudioId_fkey` FOREIGN KEY (`transformedAudioId`) REFERENCES `AudioFile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
