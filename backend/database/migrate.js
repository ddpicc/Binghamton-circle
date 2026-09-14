const { sequelize } = require('../src/models');
const fs = require('fs');
const path = require('path');

// 读取所有迁移文件
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.js'))
  .sort(); // 按文件名排序，确保按顺序执行

// 加载迁移文件
const migrations = {};
migrationFiles.forEach(file => {
  const name = file.replace('.js', '');
  migrations[name] = require(path.join(migrationsDir, file));
});

async function runMigration(direction = 'up') {
  try {
    console.log('开始运行数据库迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 创建迁移记录表（如果不存在）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sequelize_meta (
        name VARCHAR(255) PRIMARY KEY,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 获取已执行的迁移
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM sequelize_meta'
    );
    const executedNames = executedMigrations.map(m => m.name);
    
    // 根据方向执行迁移
    if (direction === 'up') {
      // 执行未执行的迁移
      for (const migrationName of Object.keys(migrations)) {
        if (!executedNames.includes(migrationName)) {
          console.log(`正在执行迁移: ${migrationName}`);
          await migrations[migrationName].up(sequelize.getQueryInterface(), require('sequelize'));
          
          // 记录迁移
          await sequelize.query(
            'INSERT INTO sequelize_meta (name) VALUES (?)',
            { replacements: [migrationName] }
          );
          
          console.log(`迁移完成: ${migrationName}`);
        }
      }
    } else if (direction === 'down') {
      // 回滚最后一个迁移
      const lastMigration = executedNames[executedNames.length - 1];
      if (lastMigration && migrations[lastMigration]) {
        console.log(`正在回滚迁移: ${lastMigration}`);
        await migrations[lastMigration].down(sequelize.getQueryInterface(), require('sequelize'));
        
        // 删除迁移记录
        await sequelize.query(
          'DELETE FROM sequelize_meta WHERE name = ?',
          { replacements: [lastMigration] }
        );
        
        console.log(`迁移回滚完成: ${lastMigration}`);
      } else {
        console.log('没有可回滚的迁移');
      }
    }
    
    console.log('数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

// 获取命令行参数
const direction = process.argv[2] || 'up';
runMigration(direction);