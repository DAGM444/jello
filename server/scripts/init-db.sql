-- Database initialization script for Jello
-- Creates database and tables with foreign key constraints & cascading deletions

CREATE DATABASE IF NOT EXISTS `jello_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `jello_db`;

-- 1. Boards table
CREATE TABLE IF NOT EXISTS `boards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `background_theme` VARCHAR(100) DEFAULT 'default',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Lists table
CREATE TABLE IF NOT EXISTS `lists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `board_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  INDEX `idx_lists_board_id` (`board_id`),
  CONSTRAINT `fk_lists_board`
    FOREIGN KEY (`board_id`)
    REFERENCES `boards` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Cards table
CREATE TABLE IF NOT EXISTS `cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `list_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `due_date` DATETIME NULL,
  `position` INT NOT NULL DEFAULT 0,
  INDEX `idx_cards_list_id` (`list_id`),
  CONSTRAINT `fk_cards_list`
    FOREIGN KEY (`list_id`)
    REFERENCES `lists` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Labels table
CREATE TABLE IF NOT EXISTS `labels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `card_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  INDEX `idx_labels_card_id` (`card_id`),
  CONSTRAINT `fk_labels_card`
    FOREIGN KEY (`card_id`)
    REFERENCES `cards` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Comments table
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `card_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_comments_card_id` (`card_id`),
  CONSTRAINT `fk_comments_card`
    FOREIGN KEY (`card_id`)
    REFERENCES `cards` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
