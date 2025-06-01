-- AlterTable
ALTER TABLE `ChallengeParticipation` ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `motivation` TEXT NULL,
    ADD COLUMN `experience` TEXT NULL,
    ADD COLUMN `socialMediaHandle` VARCHAR(191) NULL,
    ADD COLUMN `agreeToTerms` BOOLEAN NOT NULL DEFAULT false;