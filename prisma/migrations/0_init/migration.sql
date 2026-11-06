-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `role` ENUM('STUDENT', 'EDITOR', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `target_level` CHAR(2) NOT NULL DEFAULT 'N5',
    `daily_goal_minutes` INTEGER NOT NULL DEFAULT 30,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    `onboarding_completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `session_token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_sessions_session_token_key`(`session_token`),
    INDEX `auth_sessions_session_token_idx`(`session_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jlpt_levels` (
    `id` CHAR(2) NOT NULL,
    `name_vi` VARCHAR(50) NOT NULL,
    `rank_order` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` CHAR(36) NOT NULL,
    `level_id` CHAR(2) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `title_vi` VARCHAR(191) NOT NULL,
    `description_vi` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    `published_at` DATETIME(3) NULL,

    UNIQUE INDEX `courses_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` CHAR(36) NOT NULL,
    `course_id` CHAR(36) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `title_vi` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `minutes_estimate` INTEGER NOT NULL DEFAULT 30,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,

    UNIQUE INDEX `lessons_course_id_slug_key`(`course_id`, `slug`),
    UNIQUE INDEX `lessons_course_id_position_key`(`course_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_items` (
    `id` CHAR(36) NOT NULL,
    `lesson_id` CHAR(36) NULL,
    `level_id` CHAR(2) NOT NULL,
    `kind` ENUM('VOCAB', 'KANJI', 'GRAMMAR', 'KANA', 'READING', 'LISTENING') NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `reviewer_id` CHAR(36) NULL,
    `published_at` DATETIME(3) NULL,
    `version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',

    INDEX `content_items_level_id_kind_status_idx`(`level_id`, `kind`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary` (
    `content_item_id` CHAR(36) NOT NULL,
    `surface` VARCHAR(100) NOT NULL,
    `reading` VARCHAR(100) NOT NULL,
    `meaning_vi` VARCHAR(255) NOT NULL,
    `pos` VARCHAR(50) NOT NULL,
    `example_ja` TEXT NOT NULL,
    `example_reading` TEXT NOT NULL,
    `example_vi` TEXT NOT NULL,
    `search_normalized` VARCHAR(255) NOT NULL,

    INDEX `vocabulary_search_normalized_idx`(`search_normalized`),
    PRIMARY KEY (`content_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kanji` (
    `content_item_id` CHAR(36) NOT NULL,
    `character` VARCHAR(10) NOT NULL,
    `onyomi_json` JSON NOT NULL,
    `kunyomi_json` JSON NOT NULL,
    `han_viet` VARCHAR(50) NOT NULL,
    `meaning_vi` VARCHAR(255) NOT NULL,
    `strokes` INTEGER NOT NULL,
    `examples_json` JSON NOT NULL,

    UNIQUE INDEX `kanji_character_key`(`character`),
    PRIMARY KEY (`content_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grammar` (
    `content_item_id` CHAR(36) NOT NULL,
    `pattern` VARCHAR(191) NOT NULL,
    `formation_vi` TEXT NOT NULL,
    `meaning_vi` TEXT NOT NULL,
    `explanation_vi` TEXT NOT NULL,
    `examples_json` JSON NOT NULL,
    `nuance_vi` TEXT NOT NULL,

    PRIMARY KEY (`content_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_passages` (
    `id` CHAR(36) NOT NULL,
    `content_item_id` CHAR(36) NOT NULL,
    `text_ja` TEXT NOT NULL,
    `translated_vi` TEXT NOT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `copyright_source` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `reading_passages_content_item_id_key`(`content_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listening_tracks` (
    `id` CHAR(36) NOT NULL,
    `content_item_id` CHAR(36) NOT NULL,
    `media_asset_id` CHAR(36) NOT NULL,
    `transcript_ja` TEXT NOT NULL,
    `transcript_vi` TEXT NOT NULL,
    `duration_seconds` INTEGER NOT NULL,

    UNIQUE INDEX `listening_tracks_content_item_id_key`(`content_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` CHAR(36) NOT NULL,
    `level_id` CHAR(2) NOT NULL,
    `lesson_id` CHAR(36) NULL,
    `content_item_id` CHAR(36) NULL,
    `question_type` ENUM('SINGLE_CHOICE', 'KANJI_READING', 'BLANK_CHOICE', 'STAR_ORDER', 'READING', 'LISTENING') NOT NULL,
    `prompt_json` JSON NOT NULL,
    `explanation_vi` TEXT NOT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `skill_tag` VARCHAR(50) NOT NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `position` TINYINT NOT NULL,
    `text_json` JSON NOT NULL,
    `is_correct` BOOLEAN NOT NULL,

    INDEX `question_options_question_id_position_idx`(`question_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `label_vi` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_tags` (
    `question_id` CHAR(36) NOT NULL,
    `tag_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`question_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` CHAR(36) NOT NULL,
    `level_id` CHAR(2) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    `scoring_policy` VARCHAR(50) NOT NULL DEFAULT 'JLPT_SCALE_180',
    `published_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_sections` (
    `id` CHAR(36) NOT NULL,
    `exam_id` CHAR(36) NOT NULL,
    `section_type` ENUM('VOCAB', 'GRAMMAR_READING', 'LISTENING') NOT NULL,
    `position` TINYINT NOT NULL,
    `duration_seconds` INTEGER NOT NULL,
    `max_internal_points` INTEGER NOT NULL DEFAULT 60,

    INDEX `exam_sections_exam_id_position_idx`(`exam_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_questions` (
    `id` CHAR(36) NOT NULL,
    `section_id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `exam_questions_section_id_question_id_key`(`section_id`, `question_id`),
    UNIQUE INDEX `exam_questions_section_id_position_key`(`section_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_attempts` (
    `id` CHAR(36) NOT NULL,
    `exam_id` CHAR(36) NOT NULL,
    `exam_version` VARCHAR(20) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `raw_correct` INTEGER NULL,
    `raw_total` INTEGER NULL,
    `internal_score` INTEGER NULL,
    `exam_snapshot_json` JSON NOT NULL,

    INDEX `exam_attempts_user_id_status_started_at_idx`(`user_id`, `status`, `started_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempt_answers` (
    `id` CHAR(36) NOT NULL,
    `attempt_id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `answer_json` JSON NOT NULL,
    `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_correct` BOOLEAN NULL,

    UNIQUE INDEX `attempt_answers_attempt_id_question_id_key`(`attempt_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_cards` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `content_item_id` CHAR(36) NOT NULL,
    `due_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `interval_seconds` INTEGER NOT NULL DEFAULT 0,
    `ease_factor` DECIMAL(4, 2) NOT NULL DEFAULT 2.50,
    `repetitions` INTEGER NOT NULL DEFAULT 0,
    `lapses` INTEGER NOT NULL DEFAULT 0,
    `scheduler_version` VARCHAR(20) NOT NULL DEFAULT 'SIMPLE_SRS_v1',

    INDEX `review_cards_user_id_due_at_idx`(`user_id`, `due_at`),
    UNIQUE INDEX `review_cards_user_id_content_item_id_key`(`user_id`, `content_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_logs` (
    `id` CHAR(36) NOT NULL,
    `review_card_id` CHAR(36) NOT NULL,
    `idempotency_key` CHAR(36) NOT NULL,
    `grade` ENUM('AGAIN', 'HARD', 'GOOD', 'EASY') NOT NULL,
    `previous_due_at` DATETIME(3) NOT NULL,
    `new_due_at` DATETIME(3) NOT NULL,
    `reviewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `review_logs_review_card_id_idempotency_key_key`(`review_card_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_progress` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `lesson_id` CHAR(36) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `lesson_progress_user_id_lesson_id_key`(`user_id`, `lesson_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `id` CHAR(36) NOT NULL,
    `storage_key` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `byte_size` INTEGER NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `license_type` VARCHAR(50) NOT NULL,
    `attribution` TEXT NOT NULL,
    `owner_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `media_assets_storage_key_key`(`storage_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actor_id` CHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36) NOT NULL,
    `metadata_json_redacted` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_id_created_at_idx`(`actor_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `jlpt_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `jlpt_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary` ADD CONSTRAINT `vocabulary_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kanji` ADD CONSTRAINT `kanji_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grammar` ADD CONSTRAINT `grammar_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_passages` ADD CONSTRAINT `reading_passages_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listening_tracks` ADD CONSTRAINT `listening_tracks_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listening_tracks` ADD CONSTRAINT `listening_tracks_media_asset_id_fkey` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `jlpt_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_tags` ADD CONSTRAINT `question_tags_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_tags` ADD CONSTRAINT `question_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `jlpt_levels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_sections` ADD CONSTRAINT `exam_sections_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `exam_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_cards` ADD CONSTRAINT `review_cards_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_cards` ADD CONSTRAINT `review_cards_content_item_id_fkey` FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_logs` ADD CONSTRAINT `review_logs_review_card_id_fkey` FOREIGN KEY (`review_card_id`) REFERENCES `review_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

