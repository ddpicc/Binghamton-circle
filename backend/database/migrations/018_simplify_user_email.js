const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('开始精简用户邮箱字段...');
    
    // 1. 添加新的 primary_email 字段，用于存储统一的邮箱地址
    await queryInterface.addColumn('users', 'primary_email', {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '主邮箱地址'
    });
    console.log('已添加 primary_email 字段');
    
    // 2. 创建索引
    await queryInterface.addIndex('users', ['primary_email'], { unique: true });
    console.log('已创建 primary_email 唯一索引');
    
    // 3. 将现有的 email 或 school_email 数据迁移到 primary_email
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET primary_email = COALESCE(email, school_email)
      WHERE primary_email IS NULL AND (email IS NOT NULL OR school_email IS NOT NULL)
    `);
    console.log('已迁移现有邮箱数据到 primary_email');
    
    // 4. 删除旧的索引
    await queryInterface.removeIndex('users', 'users_email');
    await queryInterface.removeIndex('users', 'users_school_email');
    console.log('已删除旧的邮箱索引');
    
    // 5. 删除旧的字段
    await queryInterface.removeColumn('users', 'email');
    await queryInterface.removeColumn('users', 'school_email');
    console.log('已删除旧的 email 和 school_email 字段');
    
    console.log('用户邮箱字段精简完成');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('回滚用户邮箱字段精简...');
    
    // 添加回旧的字段
    await queryInterface.addColumn('users', 'email', {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
      comment: '邮箱'
    });
    
    await queryInterface.addColumn('users', 'school_email', {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
      comment: '学校邮箱'
    });
    console.log('已恢复 email 和 school_email 字段');
    
    // 创建旧的索引
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['school_email'], { unique: true });
    console.log('已恢复旧的邮箱索引');
    
    // 将数据迁移回旧字段
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET email = primary_email
      WHERE primary_email IS NOT NULL
    `);
    console.log('已迁移数据回旧字段');
    
    // 删除新的字段和索引
    await queryInterface.removeIndex('users', 'users_primary_email');
    await queryInterface.removeColumn('users', 'primary_email');
    console.log('已删除 primary_email 字段和索引');
    
    console.log('用户邮箱字段精简回滚完成');
  }
};