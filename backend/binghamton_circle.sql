-- MySQL dump 10.13  Distrib 8.0.27, for macos11 (arm64)
--
-- Host: 127.0.0.1    Database: binghamton_circle
-- ------------------------------------------------------
-- Server version	8.0.27

/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--

-- Table structure for table `blocked_keywords`
--

DROP TABLE IF EXISTS `blocked_keywords`;
CREATE TABLE `blocked_keywords` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `keyword` varchar(100) NOT NULL COMMENT '屏蔽关键词',
  `type` enum('exact','partial','regex') DEFAULT 'exact' COMMENT '匹配类型：exact=完全匹配，partial=包含匹配，regex=正则表达式',
  `action` enum('block','mark','replace') DEFAULT 'block' COMMENT '处理方式：block=完全屏蔽，mark=标记提醒，replace=替换为***',
  `reason` text COMMENT '屏蔽原因',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `blocked_keywords_keyword` (`keyword`),
  KEY `blocked_keywords_type` (`type`),
  KEY `blocked_keywords_is_active` (`is_active`),
  KEY `blocked_keywords_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `circle_categories`
--

DROP TABLE IF EXISTS `circle_categories`;
CREATE TABLE `circle_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `circle_count` int DEFAULT '0' COMMENT '圈子数量',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `circle_categories_name` (`name`),
  KEY `circle_categories_sort_order` (`sort_order`),
  KEY `circle_categories_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `o2o_categories`
--

DROP TABLE IF EXISTS `o2o_categories`;
CREATE TABLE `o2o_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `icon` varchar(100) DEFAULT NULL COMMENT '分类图标',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `sort_order` int DEFAULT '0' COMMENT '排序顺序',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `o2o_categories_name` (`name`),
  KEY `o2o_categories_is_active` (`is_active`),
  KEY `o2o_categories_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `sequelize_meta`
--

DROP TABLE IF EXISTS `sequelize_meta`;
CREATE TABLE `sequelize_meta` (
  `name` varchar(255) NOT NULL,
  `executed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `wechat_openid` varchar(100) DEFAULT NULL COMMENT '微信OpenID',
  `wechat_unionid` varchar(100) DEFAULT NULL COMMENT '微信UnionID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `role` enum('user','admin') DEFAULT 'user' COMMENT '用户角色',
  `status` enum('active','inactive','banned') DEFAULT 'active' COMMENT '用户状态',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `email_verified` tinyint(1) DEFAULT '0' COMMENT '邮箱是否验证',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `primary_email` varchar(100) DEFAULT NULL COMMENT '主邮箱地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `users_username` (`username`),
  UNIQUE KEY `wechat_openid` (`wechat_openid`),
  UNIQUE KEY `users_wechat_openid` (`wechat_openid`),
  UNIQUE KEY `users_primary_email` (`primary_email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '发布者用户ID',
  `title` varchar(255) NOT NULL COMMENT '活动标题',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '活动封面图URL',
  `location` varchar(255) DEFAULT NULL COMMENT '活动地点（可选）',
  `time` datetime NOT NULL COMMENT '活动时间',
  `description` text COMMENT '活动描述（可选）',
  `participant_count` int NOT NULL DEFAULT '0' COMMENT '报名参与人数',
  `status` enum('published','deleted') NOT NULL DEFAULT 'published' COMMENT '状态',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `max_participants` int DEFAULT NULL COMMENT '最大报名人数（可选）',
  PRIMARY KEY (`id`),
  KEY `activities_user_id` (`user_id`),
  KEY `activities_time` (`time`),
  KEY `activities_created_at` (`created_at`),
  KEY `activities_status` (`status`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `circles`
--

DROP TABLE IF EXISTS `circles`;
CREATE TABLE `circles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '圈子名称',
  `description` text COMMENT '圈子描述',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图URL',
  `creator_id` bigint NOT NULL COMMENT '创建者ID',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `is_public` tinyint(1) DEFAULT '1' COMMENT '是否公开',
  `need_approval` tinyint(1) DEFAULT '0' COMMENT '是否需要审核',
  `member_count` int DEFAULT '0' COMMENT '成员数量',
  `post_count` int DEFAULT '0' COMMENT '帖子数量',
  `status` enum('active','inactive','banned') DEFAULT 'active' COMMENT '状态',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `category_id` bigint DEFAULT NULL COMMENT '分类ID',
  PRIMARY KEY (`id`),
  KEY `circles_creator_id` (`creator_id`),
  KEY `circles_status` (`status`),
  KEY `circles_is_public` (`is_public`),
  KEY `circles_name` (`name`),
  KEY `circles_category_id` (`category_id`),
  KEY `circles_member_count` (`member_count`),
  KEY `circles_post_count` (`post_count`),
  CONSTRAINT `circles_category_id_foreign_idx` FOREIGN KEY (`category_id`) REFERENCES `circle_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `circles_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_a_id` bigint NOT NULL COMMENT '会话参与者A（较小的用户ID）',
  `user_b_id` bigint NOT NULL COMMENT '会话参与者B（较大的用户ID）',
  `last_message_id` bigint DEFAULT NULL COMMENT '最近一条消息ID',
  `last_message_at` datetime DEFAULT NULL COMMENT '最近消息时间',
  `unread_a` int NOT NULL DEFAULT '0' COMMENT 'A 用户未读数',
  `unread_b` int NOT NULL DEFAULT '0' COMMENT 'B 用户未读数',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_conversations_participants` (`user_a_id`,`user_b_id`),
  KEY `conversations_user_a_id` (`user_a_id`),
  KEY `conversations_user_b_id` (`user_b_id`),
  KEY `conversations_last_message_at` (`last_message_at`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_a_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_b_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `life_map_points`
--

DROP TABLE IF EXISTS `life_map_points`;
CREATE TABLE `life_map_points` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL COMMENT '点位名称',
  `description` text COMMENT '点位描述/备注',
  `category` enum('food','grocery','service','campus','other') NOT NULL DEFAULT 'other' COMMENT '类别',
  `latitude` decimal(10,7) NOT NULL COMMENT '纬度',
  `longitude` decimal(10,7) NOT NULL COMMENT '经度',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `phone` varchar(50) DEFAULT NULL COMMENT '电话',
  `website` varchar(255) DEFAULT NULL COMMENT '网站',
  `business_hours` json DEFAULT NULL COMMENT '营业时间配置',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `status` enum('active','inactive','archived') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_by` bigint DEFAULT NULL COMMENT '创建者用户ID（管理员或有权限用户）',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `life_map_points_category` (`category`),
  KEY `life_map_points_status` (`status`),
  KEY `life_map_points_created_by` (`created_by`),
  KEY `life_map_points_latitude_longitude` (`latitude`,`longitude`),
  CONSTRAINT `life_map_points_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `non_edu_email_requests`
--

DROP TABLE IF EXISTS `non_edu_email_requests`;
CREATE TABLE `non_edu_email_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `requested_username` varchar(50) NOT NULL,
  `personal_email` varchar(100) NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected','verified') NOT NULL DEFAULT 'pending',
  `admin_id` bigint DEFAULT NULL,
  `admin_note` text,
  `rejected_reason` text,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_email` (`personal_email`),
  KEY `admin_id` (`admin_id`),
  KEY `non_edu_email_requests_status` (`status`),
  CONSTRAINT `non_edu_email_requests_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium' COMMENT '优先级',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `is_published` tinyint(1) DEFAULT '1' COMMENT '是否发布',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `target_audience` json DEFAULT NULL COMMENT '目标受众',
  `attachments` json DEFAULT NULL COMMENT '附件',
  `view_count` int DEFAULT '0' COMMENT '浏览数',
  `status` enum('draft','published','archived') DEFAULT 'published' COMMENT '状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notices_user_id` (`user_id`),
  KEY `notices_category` (`category`),
  KEY `notices_priority` (`priority`),
  KEY `notices_is_pinned` (`is_pinned`),
  KEY `notices_publish_time` (`publish_time`),
  CONSTRAINT `notices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `o2o_items`
--

DROP TABLE IF EXISTS `o2o_items`;
CREATE TABLE `o2o_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL COMMENT '物品标题',
  `description` text NOT NULL COMMENT '物品描述',
  `category_id` bigint NOT NULL COMMENT '分类ID',
  `type` enum('item','service','carpool') DEFAULT 'item' COMMENT '物品类型',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `price_type` enum('fixed','negotiable','free') DEFAULT 'fixed' COMMENT '价格类型',
  `images` json DEFAULT NULL COMMENT '图片URL数组',
  `contact_info` json DEFAULT NULL COMMENT '联系信息',
  `location` varchar(255) DEFAULT NULL COMMENT '位置',
  `condition` enum('new','like_new','good','fair','poor') DEFAULT NULL COMMENT '物品状态',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `status` enum('available','reserved','sold','expired','deleted') DEFAULT 'available' COMMENT '状态',
  `view_count` int DEFAULT '0' COMMENT '浏览数',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `is_urgent` tinyint(1) DEFAULT '0' COMMENT '是否加急',
  `expire_date` datetime DEFAULT NULL COMMENT '过期时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deposit` decimal(10,2) DEFAULT NULL COMMENT '押金',
  `house_type` enum('whole','share','single') DEFAULT NULL COMMENT '房屋类型',
  `room_config` varchar(50) DEFAULT NULL COMMENT '房间配置',
  `area` decimal(8,2) DEFAULT NULL COMMENT '面积',
  `floor` varchar(50) DEFAULT NULL COMMENT '楼层',
  `orientation` varchar(20) DEFAULT NULL COMMENT '朝向',
  `facilities` json DEFAULT NULL COMMENT '配套设施',
  `move_in_date` datetime DEFAULT NULL COMMENT '可入住时间',
  `min_lease` varchar(20) DEFAULT NULL COMMENT '最短租期',
  PRIMARY KEY (`id`),
  KEY `o2o_items_user_id` (`user_id`),
  KEY `o2o_items_category_id` (`category_id`),
  KEY `o2o_items_status` (`status`),
  KEY `o2o_items_price` (`price`),
  KEY `o2o_items_created_at` (`created_at`),
  KEY `o2o_items_expire_date` (`expire_date`),
  CONSTRAINT `o2o_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `o2o_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `o2o_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `tree_hole_likes`
--

DROP TABLE IF EXISTS `tree_hole_likes`;
CREATE TABLE `tree_hole_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '点赞用户ID',
  `target_id` bigint NOT NULL COMMENT '目标ID（帖子ID或评论ID）',
  `target_type` enum('post','comment') NOT NULL COMMENT '目标类型',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tree_hole_likes_user_id_target_id_target_type` (`user_id`,`target_id`,`target_type`),
  KEY `tree_hole_likes_user_id` (`user_id`),
  KEY `tree_hole_likes_target_id` (`target_id`),
  KEY `tree_hole_likes_target_type` (`target_type`),
  CONSTRAINT `tree_hole_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `tree_hole_posts`
--

DROP TABLE IF EXISTS `tree_hole_posts`;
CREATE TABLE `tree_hole_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '发布者用户ID（仅用于管理，对外匿名）',
  `content` text NOT NULL COMMENT '帖子内容',
  `images` json DEFAULT NULL COMMENT '图片URL数组',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `comment_count` int DEFAULT '0' COMMENT '评论数',
  `view_count` int DEFAULT '0' COMMENT '浏览数',
  `status` enum('published','draft','deleted') DEFAULT 'published' COMMENT '状态',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tree_hole_posts_user_id` (`user_id`),
  KEY `tree_hole_posts_created_at` (`created_at`),
  KEY `tree_hole_posts_is_pinned` (`is_pinned`),
  KEY `tree_hole_posts_status` (`status`),
  CONSTRAINT `tree_hole_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `bio` text COMMENT '个人简介',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `gender` enum('male','female','other') DEFAULT NULL COMMENT '性别',
  `birth_date` datetime DEFAULT NULL COMMENT '出生日期',
  `school` varchar(100) DEFAULT NULL COMMENT '学校',
  `major` varchar(100) DEFAULT NULL COMMENT '专业',
  `grade` varchar(20) DEFAULT NULL COMMENT '年级',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `preferences` json DEFAULT NULL COMMENT '用户偏好设置',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `activity_participants`
--

DROP TABLE IF EXISTS `activity_participants`;
CREATE TABLE `activity_participants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_participants_activity_id_user_id` (`activity_id`,`user_id`),
  KEY `activity_participants_activity_id` (`activity_id`),
  KEY `activity_participants_user_id` (`user_id`),
  CONSTRAINT `activity_participants_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `circle_members`
--

DROP TABLE IF EXISTS `circle_members`;
CREATE TABLE `circle_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `circle_id` bigint NOT NULL COMMENT '圈子ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role` enum('creator','admin','member') DEFAULT 'member' COMMENT '角色',
  `status` enum('pending','approved','rejected','left') DEFAULT 'approved' COMMENT '状态',
  `joined_at` datetime DEFAULT NULL COMMENT '加入时间',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_circle_user` (`circle_id`,`user_id`),
  KEY `circle_members_circle_id` (`circle_id`),
  KEY `circle_members_user_id` (`user_id`),
  KEY `circle_members_status` (`status`),
  KEY `circle_members_role` (`role`),
  CONSTRAINT `circle_members_ibfk_1` FOREIGN KEY (`circle_id`) REFERENCES `circles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `circle_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL COMMENT '帖子标题',
  `content` text NOT NULL COMMENT '帖子内容',
  `is_anonymous` tinyint(1) DEFAULT '0' COMMENT '是否匿名',
  `images` json DEFAULT NULL COMMENT '图片URL数组',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `comment_count` int DEFAULT '0' COMMENT '评论数',
  `view_count` int DEFAULT '0' COMMENT '浏览数',
  `status` enum('published','draft','deleted') DEFAULT 'published' COMMENT '状态',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `circle_id` bigint DEFAULT NULL COMMENT '圈子ID',
  `is_featured` tinyint(1) DEFAULT '0' COMMENT '是否精华',
  PRIMARY KEY (`id`),
  KEY `posts_user_id` (`user_id`),
  KEY `posts_category` (`category`),
  KEY `posts_created_at` (`created_at`),
  KEY `posts_is_pinned` (`is_pinned`),
  KEY `posts_circle_id` (`circle_id`),
  KEY `posts_is_featured` (`is_featured`),
  KEY `posts_circle_id_is_featured` (`circle_id`,`is_featured`),
  CONSTRAINT `posts_circle_id_foreign_idx` FOREIGN KEY (`circle_id`) REFERENCES `circles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `content` text NOT NULL COMMENT '消息内容',
  `status` enum('sent','delivered','read') NOT NULL DEFAULT 'sent' COMMENT '消息状态',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `messages_conversation_id_created_at` (`conversation_id`,`created_at`),
  KEY `messages_receiver_id_status` (`receiver_id`,`status`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `life_map_point_submissions`
--

DROP TABLE IF EXISTS `life_map_point_submissions`;
CREATE TABLE `life_map_point_submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL COMMENT '建议的点位名称',
  `description` text COMMENT '描述/备注',
  `category` enum('food','grocery','service','campus','other') NOT NULL DEFAULT 'other' COMMENT '类别',
  `latitude` decimal(10,7) NOT NULL COMMENT '纬度',
  `longitude` decimal(10,7) NOT NULL COMMENT '经度',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `phone` varchar(50) DEFAULT NULL COMMENT '电话',
  `website` varchar(255) DEFAULT NULL COMMENT '网站',
  `business_hours` json DEFAULT NULL COMMENT '营业时间配置',
  `tags` json DEFAULT NULL COMMENT '标签数组',
  `submitted_by` bigint NOT NULL COMMENT '提交者用户ID',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `reviewed_by` bigint DEFAULT NULL COMMENT '审核管理员ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `review_note` varchar(500) DEFAULT NULL COMMENT '审核备注',
  `approved_point_id` bigint DEFAULT NULL COMMENT '审核通过后关联生成的正式点位ID',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `life_map_point_submissions_submitted_by` (`submitted_by`),
  KEY `life_map_point_submissions_status` (`status`),
  KEY `life_map_point_submissions_reviewed_by` (`reviewed_by`),
  KEY `life_map_point_submissions_approved_point_id` (`approved_point_id`),
  CONSTRAINT `life_map_point_submissions_ibfk_1` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `life_map_point_submissions_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `life_map_point_submissions_ibfk_3` FOREIGN KEY (`approved_point_id`) REFERENCES `life_map_points` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `email_verification_tokens`
--

DROP TABLE IF EXISTS `email_verification_tokens`;
CREATE TABLE `email_verification_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `token_hash` varchar(128) NOT NULL,
  `type` enum('non_edu_onboarding') NOT NULL DEFAULT 'non_edu_onboarding',
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `request_id` (`request_id`),
  KEY `user_id` (`user_id`),
  KEY `email_verification_tokens_type_expires_at` (`type`,`expires_at`),
  CONSTRAINT `email_verification_tokens_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `non_edu_email_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `email_verification_tokens_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `tree_hole_comments`
--

DROP TABLE IF EXISTS `tree_hole_comments`;
CREATE TABLE `tree_hole_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL COMMENT '树洞帖子ID',
  `user_id` bigint NOT NULL COMMENT '评论者用户ID（仅用于管理，对外匿名）',
  `content` text NOT NULL COMMENT '评论内容',
  `parent_id` bigint DEFAULT NULL COMMENT '父评论ID（用于回复）',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `status` enum('published','deleted') DEFAULT 'published' COMMENT '状态',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tree_hole_comments_post_id` (`post_id`),
  KEY `tree_hole_comments_user_id` (`user_id`),
  KEY `tree_hole_comments_parent_id` (`parent_id`),
  KEY `tree_hole_comments_created_at` (`created_at`),
  CONSTRAINT `tree_hole_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `tree_hole_posts` (`id`),
  CONSTRAINT `tree_hole_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tree_hole_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `tree_hole_comments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `parent_id` bigint DEFAULT NULL COMMENT '父评论ID，用于回复功能',
  `content` text NOT NULL COMMENT '评论内容',
  `is_anonymous` tinyint(1) DEFAULT '0' COMMENT '是否匿名',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `status` enum('published','deleted') DEFAULT 'published' COMMENT '状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_post_id` (`post_id`),
  KEY `comments_user_id` (`user_id`),
  KEY `comments_parent_id` (`parent_id`),
  KEY `comments_created_at` (`created_at`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `target_id` bigint NOT NULL COMMENT '目标ID',
  `target_type` enum('post','comment','o2o_item','notice') NOT NULL COMMENT '目标类型',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `likes_user_id_target_id_target_type` (`user_id`,`target_id`,`target_type`),
  KEY `likes_target_id_target_type` (`target_id`,`target_type`),
  KEY `likes_user_id` (`user_id`),
  KEY `likes_created_at` (`created_at`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Dumping data for table `blocked_keywords`
--

LOCK TABLES `blocked_keywords` WRITE;
/*!40000 ALTER TABLE `blocked_keywords` DISABLE KEYS */;
INSERT INTO `blocked_keywords` VALUES (1,'诈骗','partial','mark','风险内容',1,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,'代考','exact','block','违规内容',1,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,'赌博','partial','block','违法内容',1,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `blocked_keywords` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `circle_categories`
--

LOCK TABLES `circle_categories` WRITE;
/*!40000 ALTER TABLE `circle_categories` DISABLE KEYS */;
INSERT INTO `circle_categories` VALUES (1,'社交','校园社交与兴趣交流','group_work',1,1,2,'2026-03-23 08:48:26','2026-03-23 08:57:17'),(2,'学习','课程与学习互助','school',2,1,3,'2026-03-23 08:48:26','2026-03-23 08:57:17'),(3,'生活','租房、美食、出行等','forest',3,1,1,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(4,'活动','校园活动与社团','event',4,1,0,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `circle_categories` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `o2o_categories`
--

LOCK TABLES `o2o_categories` WRITE;
/*!40000 ALTER TABLE `o2o_categories` DISABLE KEYS */;
INSERT INTO `o2o_categories` VALUES (1,'second_hand','二手交易','storefront',1,1,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,'rental','租房信息','home',1,2,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `o2o_categories` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `sequelize_meta`
--

LOCK TABLES `sequelize_meta` WRITE;
/*!40000 ALTER TABLE `sequelize_meta` DISABLE KEYS */;
INSERT INTO `sequelize_meta` VALUES ('001_create_tables','2025-09-03 00:58:58'),('002_fix_o2o_category_structure','2025-09-03 00:58:58'),('003_create_circles_table','2025-09-03 00:58:58'),('004_create_circle_members_table','2025-09-03 00:58:58'),('005_add_circle_fields_to_posts','2025-09-03 00:58:58'),('006_create_circle_categories_table','2025-09-03 00:58:58'),('007_add_circle_count_to_categories','2025-09-03 01:53:27'),('008_remove_max_members_from_circles','2025-09-03 01:53:27'),('009_create_tree_hole_tables','2025-09-03 09:05:02'),('010_create_life_map_tables','2025-09-09 01:03:20'),('011_create_activities_table','2025-09-15 10:18:46'),('012_create_activity_participants_table','2025-09-15 10:26:13'),('013_add_max_participants_to_activities','2025-09-21 12:58:46'),('014_remove_title_from_tree_hole_posts','2025-09-23 04:43:18'),('015_create_conversations_and_messages','2025-10-24 00:48:31'),('016_create_blocked_keywords_table','2025-10-27 07:16:20'),('017_create_non_edu_requests_table','2025-10-27 07:16:20'),('018_simplify_user_email','2025-10-27 07:52:25');
/*!40000 ALTER TABLE `sequelize_meta` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,NULL,'admin','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','admin','active','2026-03-23 13:23:17',1,'2026-03-23 08:48:26','2026-03-23 13:23:17','admin@binghamton.edu'),(2,NULL,NULL,'testuser','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','testuser@binghamton.edu'),(3,NULL,NULL,'alex','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','alex@binghamton.edu'),(4,NULL,NULL,'emily','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','emily@binghamton.edu'),(5,NULL,NULL,'jason','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','jason@binghamton.edu'),(6,NULL,NULL,'mia','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','mia@binghamton.edu'),(7,NULL,NULL,'owen','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','owen@binghamton.edu'),(8,NULL,NULL,'lucy','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','lucy@binghamton.edu'),(9,NULL,NULL,'kevin','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','kevin@binghamton.edu'),(10,NULL,NULL,'zoe','$2b$10$LbQOrfZZixA8yYUD7sFVSuIqI28aK9ku6Y/VMuX/FIepFqXsAN5l6','user','active',NULL,1,'2026-03-23 08:48:26','2026-03-23 08:48:26','zoe@binghamton.edu'),(11,'dev_test_wechat_user_001',NULL,'wx_user_001',NULL,'user','active','2026-03-24 01:07:35',0,'2026-03-23 08:52:44','2026-03-24 01:07:35',NULL),(12,NULL,NULL,'julian_cs','$2b$10$lRtr2KSb4E20AlTnXTELSu29hVZVwV6iOnLFz3Ju.NzR5519To3xe','user','active',NULL,1,'2026-03-23 08:56:25','2026-03-23 08:56:25','julian.cs@binghamton.edu'),(13,NULL,NULL,'sarah_reads','$2b$10$DTGB5va1lSl.eAcIsI15COJaRRNOgADw/H/kFvsJbd35RcwJ8cKE6','user','active',NULL,1,'2026-03-23 08:57:16','2026-03-23 08:57:16','sarah.reads@binghamton.edu'),(14,NULL,NULL,'alex_photo','$2b$10$CdIUT38EzMpzZjfY5Nit2.RVu0rDyiQDHlsdYm5B8tO0Kw4HMKHXC','user','active',NULL,1,'2026-03-23 08:57:17','2026-03-23 08:57:17','alex.photo@binghamton.edu');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,3,'春季草坪音乐节 · 2024','https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80','中央图书馆东侧大草坪','2026-03-23 06:00:00','不插电现场、草坪市集、落日合唱。',156,'published','2026-03-23 08:48:26','2026-03-23 08:48:26',300),(2,2,'创新创业校友沙龙：从0到1','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80','学生活动中心 302 报告厅','2026-03-24 06:00:00','邀请校友分享创业路径与资源链接。',56,'published','2026-03-23 08:48:26','2026-03-23 08:48:26',120),(3,7,'落日余晖：环校夜跑计划','https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80','北校区体育场大门','2026-03-25 10:30:00','5公里轻松跑，欢迎新手。',30,'published','2026-03-23 08:48:26','2026-03-23 08:48:26',80),(4,4,'周末手工工坊：扎染艺术体验','https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&q=80','艺术学院 101 工作室','2026-03-27 01:00:00','提供材料，成品可带走。',18,'published','2026-03-23 08:48:26','2026-03-23 08:48:26',30);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `circles`
--

LOCK TABLES `circles` WRITE;
/*!40000 ALTER TABLE `circles` DISABLE KEYS */;
INSERT INTO `circles` VALUES (1,'自然与校园摄影','记录Binghamton四季与校园日常，欢迎分享作品与参数。','https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&q=80',2,'[\"摄影\", \"校园\", \"风景\"]',1,0,5,1,'active','2026-03-23 08:48:26','2026-03-23 13:25:55',1),(2,'心理学荣誉学会','心理学学术分享、活动组织与资源互助。','https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',10,'[\"心理学\", \"学术\", \"分享\"]',1,1,3,1,'active','2026-03-23 08:48:26','2026-03-23 08:48:26',2),(3,'租房互助站','租房避坑、转租信息和生活互助。','https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',9,'[\"租房\", \"转租\", \"生活\"]',1,0,3,1,'active','2026-03-23 08:48:26','2026-03-23 08:48:26',3),(4,'CS圈子','课程答疑、项目讨论、求组队都可以来这里交流。','https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',12,'[\"CS\", \"学习\", \"项目\"]',1,0,1,1,'active','2026-03-23 08:57:17','2026-03-23 08:57:17',2),(5,'读书会','技术书、社科书都欢迎，一起阅读一起讨论。','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',13,'[\"读书\", \"面试\", \"分享\"]',1,0,1,1,'active','2026-03-23 08:57:17','2026-03-23 08:57:17',2),(6,'摄影','记录校园里的光影瞬间，欢迎晒图与交流。','https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=1200&q=80',14,'[\"摄影\", \"校园\", \"美学\"]',1,0,1,1,'active','2026-03-23 08:57:17','2026-03-23 08:57:17',1);
/*!40000 ALTER TABLE `circles` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,2,3,2,'2026-03-23 08:48:26',1,0,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `life_map_points`
--

LOCK TABLES `life_map_points` WRITE;
/*!40000 ALTER TABLE `life_map_points` DISABLE KEYS */;
INSERT INTO `life_map_points` VALUES (1,'Moonbear Cafe','咖啡与轻食，适合学习。','food',42.0892001,-75.9693002,'Downtown Binghamton','607-111-1001',NULL,NULL,'[\"咖啡\", \"学习\"]','active',2,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,'Campus Grocery','日常补给。','grocery',42.0888001,-75.9712002,'Near Main St','607-111-1002',NULL,NULL,'[\"超市\"]','active',6,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,'Tech Print Service','打印扫描。','service',42.0910001,-75.9701002,'University Plaza','607-111-1003',NULL,NULL,'[\"打印\"]','active',3,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(4,'Old Union Gate','校园打卡点。','campus',42.0905001,-75.9688002,'Campus West',NULL,NULL,NULL,'[\"地标\"]','active',8,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `life_map_points` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `non_edu_email_requests`
--

LOCK TABLES `non_edu_email_requests` WRITE;
/*!40000 ALTER TABLE `non_edu_email_requests` DISABLE KEYS */;
INSERT INTO `non_edu_email_requests` VALUES (1,'guest_mike','mike.demo@gmail.com','校外合作项目沟通需要','approved',1,'已通过演示申请',NULL,'2026-03-21 03:00:00',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `non_edu_email_requests` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (1,1,'2026春季学期选课时间提醒','请同学们于本周三前完成选课，逾期系统将关闭。','教务','high',1,1,'2026-03-21 01:00:00',NULL,NULL,NULL,320,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,1,'图书馆夜间开放时段调整','期中周期间图书馆延长至凌晨1点闭馆。','校园','medium',0,1,'2026-03-22 02:30:00',NULL,NULL,NULL,183,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,1,'本周末校园二手集市招募摊主','欢迎同学报名摆摊，提供桌椅和基础物料。','活动','medium',0,1,'2026-03-22 06:00:00',NULL,NULL,NULL,139,'published','2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `o2o_items`
--

LOCK TABLES `o2o_items` WRITE;
/*!40000 ALTER TABLE `o2o_items` DISABLE KEYS */;
INSERT INTO `o2o_items` VALUES (1,2,'苹果笔记本电脑','M2 8+256G，正常使用痕迹，电池健康良好。',1,'item',800.00,999.00,'fixed','[\"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80\"]','{\"wechat\": \"testuser1\"}','学生活动中心','like_new','[\"笔记本\", \"苹果\"]','available',175,12,0,0,NULL,'2026-03-23 08:48:26','2026-03-23 13:55:07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,1,'CS基础课原版教材合集','离散数学、数据库系统、操作系统三本，附带课堂笔记。',1,'item',45.00,NULL,'fixed','[\"https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&q=80\"]','{\"wechat\": \"admin_books\"}','图书馆门口','good','[\"教材\", \"计算机\"]','available',160,8,0,0,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,4,'单间转租，近北校区体育馆','4月起租，家具齐全，包水网。',2,'item',650.00,NULL,'negotiable','[\"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80\"]','{\"wechat\": \"emily_rent\"}','North Side','good','[\"转租\", \"近校区\"]','available',213,15,0,0,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26',650.00,'single','1室1卫',22.50,'3/5','south','[\"空调\", \"洗衣机\", \"书桌\"]','2026-04-01 16:00:00','6个月'),(4,6,'Nike 运动鞋 Size 42','仅试穿一次，几乎全新。',1,'item',350.00,NULL,'fixed','[\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80\"]','{\"wechat\": \"mia_sneaker\"}','Union','like_new','[\"球鞋\"]','available',96,5,0,0,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `o2o_items` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `tree_hole_likes`
--

LOCK TABLES `tree_hole_likes` WRITE;
/*!40000 ALTER TABLE `tree_hole_likes` DISABLE KEYS */;
INSERT INTO `tree_hole_likes` VALUES (1,3,1,'post','2026-03-23 08:48:26'),(2,4,1,'post','2026-03-23 08:48:26'),(3,5,2,'post','2026-03-23 08:48:26'),(4,6,3,'post','2026-03-23 08:48:26'),(5,10,3,'post','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `tree_hole_likes` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `tree_hole_posts`
--

LOCK TABLES `tree_hole_posts` WRITE;
/*!40000 ALTER TABLE `tree_hole_posts` DISABLE KEYS */;
INSERT INTO `tree_hole_posts` VALUES (1,2,'最近课业压力有点大，但今天傍晚的风很温柔，突然又觉得可以坚持一下。','[]','[\"学习\", \"心情\"]',8,2,140,'published',0,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,8,'谢谢昨天在图书馆帮我找资料的同学，陌生人的善意真的会发光。','[]','[\"感谢\", \"日常\"]',12,1,102,'published',0,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,7,'夜跑完抬头看到星星，突然觉得烦恼没有那么可怕。','[\"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80\"]','[\"夜跑\", \"治愈\"]',21,3,198,'published',1,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `tree_hole_posts` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,1,'admin','https://i.pravatar.cc/120?img=12','系统管理员',NULL,NULL,NULL,'Binghamton University','Information Systems','Graduate',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,2,'testuser','https://i.pravatar.cc/120?img=32','爱摄影爱生活',NULL,NULL,NULL,'Binghamton University','Computer Science','Junior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,3,'Alex Harrington','https://i.pravatar.cc/120?img=54','活动组织者',NULL,NULL,NULL,'Binghamton University','Business','Senior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(4,4,'Emily C.','https://i.pravatar.cc/120?img=48','手工社成员',NULL,NULL,NULL,'Binghamton University','Art','Sophomore',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(5,5,'J. Wilson','https://i.pravatar.cc/120?img=15','音乐发烧友',NULL,NULL,NULL,'Binghamton University','Music','Senior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(6,6,'Mia','https://i.pravatar.cc/120?img=23','二手达人',NULL,NULL,NULL,'Binghamton University','Data Science','Junior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(7,7,'Owen','https://i.pravatar.cc/120?img=64','跑步爱好者',NULL,NULL,NULL,'Binghamton University','Mechanical Engineering','Senior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(8,8,'Lucy','https://i.pravatar.cc/120?img=27','校园生活记录者',NULL,NULL,NULL,'Binghamton University','Media','Sophomore',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(9,9,'Kevin','https://i.pravatar.cc/120?img=68','租房互助群群主',NULL,NULL,NULL,'Binghamton University','Finance','Graduate',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(10,10,'Zoe','https://i.pravatar.cc/120?img=5','热心学姐',NULL,NULL,NULL,'Binghamton University','Psychology','Senior',NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26'),(11,11,'道理都懂','http://tmp/75CwhEMGatOmf4e3cd4348d181c6e209d3f54beb77f1.jpeg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-23 08:52:44','2026-03-23 09:25:40'),(12,12,'陈子航 (Julian)','https://i.pravatar.cc/120?img=24','CS 圈子发起人',NULL,NULL,NULL,'Binghamton University','Computer Science','Junior',NULL,NULL,'2026-03-23 08:57:16','2026-03-23 08:57:16'),(13,13,'Sarah Mitchell','https://i.pravatar.cc/120?img=26','读书会组织者',NULL,NULL,NULL,'Binghamton University','Computer Science','Junior',NULL,NULL,'2026-03-23 08:57:16','2026-03-23 08:57:16'),(14,14,'Alex Rivera','https://i.pravatar.cc/120?img=28','校园摄影爱好者',NULL,NULL,NULL,'Binghamton University','Computer Science','Junior',NULL,NULL,'2026-03-23 08:57:17','2026-03-23 08:57:17');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `activity_participants`
--

LOCK TABLES `activity_participants` WRITE;
/*!40000 ALTER TABLE `activity_participants` DISABLE KEYS */;
INSERT INTO `activity_participants` VALUES (1,1,2,'2026-03-23 08:48:26'),(2,1,4,'2026-03-23 08:48:26'),(3,1,5,'2026-03-23 08:48:26'),(4,2,3,'2026-03-23 08:48:26'),(5,2,6,'2026-03-23 08:48:26'),(6,3,8,'2026-03-23 08:48:26'),(7,3,9,'2026-03-23 08:48:26'),(8,4,10,'2026-03-23 08:48:26');
/*!40000 ALTER TABLE `activity_participants` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `circle_members`
--

LOCK TABLES `circle_members` WRITE;
/*!40000 ALTER TABLE `circle_members` DISABLE KEYS */;
INSERT INTO `circle_members` VALUES (1,1,2,'creator','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,2,10,'creator','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,3,9,'creator','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(4,1,3,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(5,1,4,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(6,1,6,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(7,2,2,'admin','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(8,2,8,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(9,3,7,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(10,3,5,'member','approved','2026-03-23 08:48:26','2026-03-23 08:48:26','2026-03-23 08:48:26'),(11,4,12,'creator','approved','2026-03-23 08:57:17','2026-03-23 08:57:17','2026-03-23 08:57:17'),(12,5,13,'creator','approved','2026-03-23 08:57:17','2026-03-23 08:57:17','2026-03-23 08:57:17'),(13,6,14,'creator','approved','2026-03-23 08:57:17','2026-03-23 08:57:17','2026-03-23 08:57:17'),(14,1,11,'member','approved','2026-03-23 13:25:55','2026-03-23 13:25:55','2026-03-23 13:25:55');
/*!40000 ALTER TABLE `circle_members` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,2,'今天晚霞太美了，图书馆后面拍到的','逆光下的云层层次非常好看，参数：35mm f2.0 1/250 ISO100。',0,'[\"https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1200&q=80\"]','摄影','[\"晚霞\", \"校园摄影\"]',12,2,129,'published',0,'2026-03-23 08:48:26','2026-03-23 13:51:25',1,0),(2,10,'本周心理学读书会主题：社会认知','周五晚7点，心理楼201，欢迎带着你最近读到的论文来讨论。',0,'[]','学习','[\"读书会\", \"心理学\"]',8,1,79,'published',0,'2026-03-23 08:48:26','2026-03-23 08:48:26',2,0),(3,9,'靠近校车站2b1b转租，5月可入住','家具齐全，步行8分钟到校车站，支持看房。',0,'[\"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80\"]','生活','[\"转租\", \"2b1b\"]',17,4,230,'published',0,'2026-03-23 08:48:26','2026-03-23 08:48:26',3,0),(4,12,'终于在工程大楼熬完了晚上的实验课','终于在工程大楼熬完了晚上的实验课。新的GPU集群速度简直惊人！还有谁在为期末考拼命？💻🔥',0,'[\"https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80\"]','CS圈子','[\"实验课\", \"GPU\", \"期末\"]',124,18,520,'published',0,'2026-03-23 08:57:17','2026-03-23 08:57:17',4,0),(5,13,'求借《代码整洁之道》周末看看','有人可以借我一本《代码整洁之道》(Clean Code) 周末看看吗？下周一有个技术面试要准备。非常乐意请喝咖啡作为交换！☕️📚',0,'[]','读书会','[\"读书会\", \"面试\", \"Clean Code\"]',42,5,260,'published',0,'2026-03-23 08:57:17','2026-03-23 08:57:17',5,0),(6,14,'纪念喷泉的落日时刻','今天落日余晖洒在纪念喷泉上的那一刻，简直如梦似幻。🏛️✨',0,'[\"https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&q=80\", \"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80\"]','摄影','[\"摄影\", \"落日\", \"校园\"]',89,12,410,'published',0,'2026-03-23 08:57:17','2026-03-23 08:57:17',6,0);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,2,3,'周三活动海报我做好了，你看看要不要改颜色？','read','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,1,3,2,'很好看，明早我发到群里。','sent','2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `life_map_point_submissions`
--

LOCK TABLES `life_map_point_submissions` WRITE;
/*!40000 ALTER TABLE `life_map_point_submissions` DISABLE KEYS */;
INSERT INTO `life_map_point_submissions` VALUES (1,'Late Night Noodles','晚上营业到凌晨，适合夜猫子。','food',42.0878001,-75.9708002,'Court St',NULL,NULL,NULL,'[\"夜宵\", \"面食\"]',7,'pending',NULL,NULL,NULL,NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `life_map_point_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `email_verification_tokens`
--

LOCK TABLES `email_verification_tokens` WRITE;
/*!40000 ALTER TABLE `email_verification_tokens` DISABLE KEYS */;
INSERT INTO `email_verification_tokens` VALUES (1,1,NULL,'mike.demo@gmail.com','demo_token_hash_20260323','non_edu_onboarding','2026-03-25 15:59:00',NULL,'2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `email_verification_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `tree_hole_comments`
--

LOCK TABLES `tree_hole_comments` WRITE;
/*!40000 ALTER TABLE `tree_hole_comments` DISABLE KEYS */;
INSERT INTO `tree_hole_comments` VALUES (1,1,10,'你已经很棒了，记得按时休息。',NULL,0,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,1,3,'加油，期中后一起吃顿好的。',NULL,0,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,3,4,'这条好治愈！',NULL,0,'published','2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `tree_hole_comments` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,1,3,NULL,'这个机位绝了！',0,1,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,1,4,NULL,'颜色太干净了，赞。',0,0,'published','2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,2,8,NULL,'我会带一篇相关论文来分享。',0,0,'published','2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (1,3,1,'post','2026-03-23 08:48:26','2026-03-23 08:48:26'),(2,4,1,'post','2026-03-23 08:48:26','2026-03-23 08:48:26'),(3,6,3,'post','2026-03-23 08:48:26','2026-03-23 08:48:26');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Dumping events for database 'binghamton_circle'
--

--
-- Dumping routines for database 'binghamton_circle'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-24 16:08:56
