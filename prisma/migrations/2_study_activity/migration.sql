-- CreateTable
CREATE TABLE `study_activities` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `day` DATE NOT NULL,
    `minutes` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `study_activities_user_id_day_key`(`user_id`, `day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `study_activities` ADD CONSTRAINT `study_activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

