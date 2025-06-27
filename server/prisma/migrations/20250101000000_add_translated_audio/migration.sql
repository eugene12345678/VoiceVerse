-- CreateTable
CREATE TABLE `TranslatedAudio` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originalAudioId` VARCHAR(191) NOT NULL,
    `targetLanguage` VARCHAR(191) NOT NULL,
    `translatedText` TEXT NOT NULL,
    `audioData` LONGBLOB NULL,
    `filePath` VARCHAR(191) NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'audio/mpeg',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `TranslatedAudio_userId_fkey` ON `TranslatedAudio`(`userId`);

-- CreateIndex
CREATE INDEX `TranslatedAudio_originalAudioId_fkey` ON `TranslatedAudio`(`originalAudioId`);

-- AddForeignKey
ALTER TABLE `TranslatedAudio` ADD CONSTRAINT `TranslatedAudio_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslatedAudio` ADD CONSTRAINT `TranslatedAudio_originalAudioId_fkey` FOREIGN KEY (`originalAudioId`) REFERENCES `AudioFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;