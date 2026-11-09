-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `furigana_default` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ui_language` CHAR(2) NOT NULL DEFAULT 'vi';

