module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, TEXT, JSON, INTEGER, ENUM, DATE, BOOLEAN } = Sequelize.DataTypes;

    await queryInterface.createTable('tree_hole_posts', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '发布者用户ID（仅用于管理，对外匿名）'
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '帖子内容'
      },
      images: {
        type: JSON,
        allowNull: true,
        comment: '图片URL数组'
      },
      tags: {
        type: JSON,
        allowNull: true,
        comment: '标签数组'
      },
      like_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '点赞数'
      },
      comment_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '评论数'
      },
      view_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '浏览数'
      },
      status: {
        type: ENUM('published', 'draft', 'deleted'),
        defaultValue: 'published',
        comment: '状态'
      },
      is_pinned: {
        type: BOOLEAN,
        defaultValue: false,
        comment: '是否置顶'
      },
      created_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('tree_hole_comments', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      post_id: {
        type: BIGINT,
        allowNull: false,
        references: {
          model: 'tree_hole_posts',
          key: 'id'
        },
        comment: '树洞帖子ID'
      },
      user_id: {
        type: BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '评论者用户ID（仅用于管理，对外匿名）'
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '评论内容'
      },
      parent_id: {
        type: BIGINT,
        allowNull: true,
        references: {
          model: 'tree_hole_comments',
          key: 'id'
        },
        comment: '父评论ID（用于回复）'
      },
      like_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '点赞数'
      },
      status: {
        type: ENUM('published', 'deleted'),
        defaultValue: 'published',
        comment: '状态'
      },
      created_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('tree_hole_likes', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '点赞用户ID'
      },
      target_id: {
        type: BIGINT,
        allowNull: false,
        comment: '目标ID（帖子ID或评论ID）'
      },
      target_type: {
        type: ENUM('post', 'comment'),
        allowNull: false,
        comment: '目标类型'
      },
      created_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // 创建索引
    await queryInterface.addIndex('tree_hole_posts', ['user_id']);
    await queryInterface.addIndex('tree_hole_posts', ['created_at']);
    await queryInterface.addIndex('tree_hole_posts', ['is_pinned']);
    await queryInterface.addIndex('tree_hole_posts', ['status']);

    await queryInterface.addIndex('tree_hole_comments', ['post_id']);
    await queryInterface.addIndex('tree_hole_comments', ['user_id']);
    await queryInterface.addIndex('tree_hole_comments', ['parent_id']);
    await queryInterface.addIndex('tree_hole_comments', ['created_at']);

    await queryInterface.addIndex('tree_hole_likes', ['user_id']);
    await queryInterface.addIndex('tree_hole_likes', ['target_id']);
    await queryInterface.addIndex('tree_hole_likes', ['target_type']);
    await queryInterface.addIndex('tree_hole_likes', ['user_id', 'target_id', 'target_type'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tree_hole_likes');
    await queryInterface.dropTable('tree_hole_comments');
    await queryInterface.dropTable('tree_hole_posts');
  }
};
