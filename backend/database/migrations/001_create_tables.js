const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      wechat_openid: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
        comment: '微信OpenID'
      },
      wechat_unionid: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '微信UnionID'
      },
      username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: '用户名'
      },
      email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
        comment: '邮箱'
      },
      school_email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
        comment: '学校邮箱'
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '密码'
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        comment: '用户角色'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active',
        comment: '用户状态'
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后登录时间'
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '邮箱是否验证'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('user_profiles', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '昵称'
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '头像URL'
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '个人简介'
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '手机号'
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
        comment: '性别'
      },
      birth_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '出生日期'
      },
      school: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '学校'
      },
      major: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '专业'
      },
      grade: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '年级'
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '地址'
      },
      preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '用户偏好设置'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('posts', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '帖子标题'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '帖子内容'
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否匿名'
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '图片URL数组'
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '分类'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '标签数组'
      },
      like_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '点赞数'
      },
      comment_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '评论数'
      },
      view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '浏览数'
      },
      status: {
        type: DataTypes.ENUM('published', 'draft', 'deleted'),
        defaultValue: 'published',
        comment: '状态'
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否置顶'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('comments', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      post_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '父评论ID，用于回复功能'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '评论内容'
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否匿名'
      },
      like_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '点赞数'
      },
      status: {
        type: DataTypes.ENUM('published', 'deleted'),
        defaultValue: 'published',
        comment: '状态'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('notices', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '通知标题'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '通知内容'
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '分类'
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        comment: '优先级'
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否置顶'
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否发布'
      },
      publish_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '发布时间'
      },
      expire_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '过期时间'
      },
      target_audience: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '目标受众'
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '附件'
      },
      view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '浏览数'
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'published',
        comment: '状态'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('o2o_items', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '物品标题'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '物品描述'
      },
      category: {
        type: DataTypes.ENUM('second_hand', 'rental', 'carpool', 'service', 'other'),
        allowNull: false,
        comment: '分类'
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '价格'
      },
      price_type: {
        type: DataTypes.ENUM('fixed', 'negotiable', 'free'),
        defaultValue: 'fixed',
        comment: '价格类型'
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '图片URL数组'
      },
      contact_info: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '联系信息'
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '位置'
      },
      condition: {
        type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
        allowNull: true,
        comment: '物品状态'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '标签数组'
      },
      status: {
        type: DataTypes.ENUM('available', 'reserved', 'sold', 'expired', 'deleted'),
        defaultValue: 'available',
        comment: '状态'
      },
      view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '浏览数'
      },
      like_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '点赞数'
      },
      expire_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '过期时间'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.createTable('likes', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '目标ID'
      },
      target_type: {
        type: DataTypes.ENUM('post', 'comment', 'o2o_item', 'notice'),
        allowNull: false,
        comment: '目标类型'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // 创建索引
    await queryInterface.addIndex('users', ['wechat_openid'], { unique: true });
    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['primary_email'], { unique: true });
    
    await queryInterface.addIndex('posts', ['user_id']);
    await queryInterface.addIndex('posts', ['category']);
    await queryInterface.addIndex('posts', ['created_at']);
    await queryInterface.addIndex('posts', ['is_pinned']);
    
    await queryInterface.addIndex('comments', ['post_id']);
    await queryInterface.addIndex('comments', ['user_id']);
    await queryInterface.addIndex('comments', ['parent_id']);
    await queryInterface.addIndex('comments', ['created_at']);
    
    await queryInterface.addIndex('notices', ['user_id']);
    await queryInterface.addIndex('notices', ['category']);
    await queryInterface.addIndex('notices', ['priority']);
    await queryInterface.addIndex('notices', ['is_pinned']);
    await queryInterface.addIndex('notices', ['publish_time']);
    
    await queryInterface.addIndex('o2o_items', ['user_id']);
    await queryInterface.addIndex('o2o_items', ['category']);
    await queryInterface.addIndex('o2o_items', ['status']);
    await queryInterface.addIndex('o2o_items', ['price']);
    await queryInterface.addIndex('o2o_items', ['created_at']);
    await queryInterface.addIndex('o2o_items', ['expire_date']);
    
    await queryInterface.addIndex('likes', ['user_id', 'target_id', 'target_type'], { unique: true });
    await queryInterface.addIndex('likes', ['target_id', 'target_type']);
    await queryInterface.addIndex('likes', ['user_id']);
    await queryInterface.addIndex('likes', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('likes');
    await queryInterface.dropTable('o2o_items');
    await queryInterface.dropTable('notices');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('user_profiles');
    await queryInterface.dropTable('users');
  }
};