const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env.local' });

// 直接创建数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME || 'binghamton_circle',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

const { User, UserProfile, Circle, CircleCategory, CircleMember, Post, Notice, Comment, Like } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  try {
    console.log('开始创建测试账号...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 生成密码哈希
    const saltRounds = 10;
    
    // 创建管理员用户
    const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
    const adminUser = await User.findOrCreate({
      where: { email: 'admin@ivyelite.net' },
      defaults: {
        username: 'admin',
        email: 'admin@ivyelite.net',
        password: adminPasswordHash,
        role: 'admin',
        status: 'active',
        email_verified: true
      }
    });
    
    // 创建测试用户1
    const test1PasswordHash = await bcrypt.hash('test123', saltRounds);
    const testUser1 = await User.findOrCreate({
      where: { email: 'test1@ivyelite.net' },
      defaults: {
        username: 'testuser1',
        email: 'test1@ivyelite.net',
        password: test1PasswordHash,
        role: 'user',
        status: 'active',
        email_verified: true
      }
    });
    
    // 创建测试用户2
    const test2PasswordHash = await bcrypt.hash('test123', saltRounds);
    const testUser2 = await User.findOrCreate({
      where: { email: 'test2@ivyelite.net' },
      defaults: {
        username: 'testuser2',
        email: 'test2@ivyelite.net',
        password: test2PasswordHash,
        role: 'user',
        status: 'active',
        email_verified: true
      }
    });
    
    // 为用户创建资料
    if (adminUser[1]) { // 如果是新创建的
      await UserProfile.create({
        user_id: adminUser[0].id,
        nickname: '系统管理员',
        bio: '这是系统管理员账号',
        avatar: null,
        gender: 'other',
        birth_year: 1990
      });
    }
    
    if (testUser1[1]) { // 如果是新创建的
      await UserProfile.create({
        user_id: testUser1[0].id,
        nickname: '测试用户一',
        bio: '这是第一个测试账号',
        avatar: null,
        gender: 'male',
        birth_year: 2000
      });
    }
    
    if (testUser2[1]) { // 如果是新创建的
      await UserProfile.create({
        user_id: testUser2[0].id,
        nickname: '测试用户二',
        bio: '这是第二个测试账号',
        avatar: null,
        gender: 'female',
        birth_year: 2001
      });
    }
    
    console.log('\n测试账号创建完成！');
    console.log('========================');
    console.log('1. 管理员账号:');
    console.log('   邮箱: admin@ivyelite.net');
    console.log('   密码: admin123');
    console.log('   角色: admin');
    console.log('\n2. 测试账号1:');
    console.log('   邮箱: test1@ivyelite.net');
    console.log('   密码: test123');
    console.log('   角色: user');
    console.log('\n3. 测试账号2:');
    console.log('   邮箱: test2@ivyelite.net');
    console.log('   密码: test123');
    console.log('   角色: user');
    
    process.exit(0);
  } catch (error) {
    console.error('创建测试账号失败:', error);
    process.exit(1);
  }
}

createTestUsers();