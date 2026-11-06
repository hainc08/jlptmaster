-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `after_json` JSON NULL,
    ADD COLUMN `before_json` JSON NULL,
    ADD COLUMN `ip` VARCHAR(45) NULL;

-- AlterTable
ALTER TABLE `jlpt_levels` ADD COLUMN `description` VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN `display_order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pass_score` INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED', 'COMING_SOON') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `display_name` VARCHAR(120) NULL,
    ADD COLUMN `last_active_at` DATETIME(3) NULL,
    ADD COLUMN `plan` ENUM('FREE', 'STANDARD', 'PREMIUM') NOT NULL DEFAULT 'FREE',
    ADD COLUMN `plan_expires_at` DATETIME(3) NULL,
    MODIFY `role` ENUM('STUDENT', 'EDITOR', 'ADMIN', 'OWNER', 'SUPPORT') NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE `system_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value_json` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role` ENUM('STUDENT', 'EDITOR', 'ADMIN', 'OWNER', 'SUPPORT') NOT NULL,
    `module` VARCHAR(30) NOT NULL,
    `allowed` BOOLEAN NOT NULL,

    PRIMARY KEY (`role`, `module`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Backfill existing levels (display order follows the natural JLPT rank; active levels are published).
UPDATE `jlpt_levels` SET `display_order` = `rank_order`;
UPDATE `jlpt_levels` SET `status` = 'PUBLISHED' WHERE `is_active` = 1;
UPDATE `jlpt_levels` SET `status` = 'COMING_SOON' WHERE `is_active` = 0 AND `rank_order` >= 4;
