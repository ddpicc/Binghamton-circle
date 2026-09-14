const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('开始添加O2O租房信息字段...');
    
    // 添加租房信息相关字段
    await queryInterface.addColumn('o2o_items', 'deposit', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '押金'
    });
    console.log('已添加 deposit 字段');
    
    await queryInterface.addColumn('o2o_items', 'house_type', {
      type: DataTypes.ENUM('whole', 'share', 'single'),
      allowNull: true,
      comment: '房屋类型'
    });
    console.log('已添加 house_type 字段');
    
    await queryInterface.addColumn('o2o_items', 'room_config', {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '房间配置'
    });
    console.log('已添加 room_config 字段');
    
    await queryInterface.addColumn('o2o_items', 'area', {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: '面积'
    });
    console.log('已添加 area 字段');
    
    await queryInterface.addColumn('o2o_items', 'floor', {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '楼层'
    });
    console.log('已添加 floor 字段');
    
    await queryInterface.addColumn('o2o_items', 'orientation', {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '朝向'
    });
    console.log('已添加 orientation 字段');
    
    await queryInterface.addColumn('o2o_items', 'facilities', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '配套设施'
    });
    console.log('已添加 facilities 字段');
    
    await queryInterface.addColumn('o2o_items', 'move_in_date', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '可入住时间'
    });
    console.log('已添加 move_in_date 字段');
    
    await queryInterface.addColumn('o2o_items', 'min_lease', {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '最短租期'
    });
    console.log('已添加 min_lease 字段');
    
    console.log('O2O租房信息字段添加完成');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('开始回滚O2O租房信息字段...');
    
    // 删除租房信息相关字段
    await queryInterface.removeColumn('o2o_items', 'min_lease');
    console.log('已删除 min_lease 字段');
    
    await queryInterface.removeColumn('o2o_items', 'move_in_date');
    console.log('已删除 move_in_date 字段');
    
    await queryInterface.removeColumn('o2o_items', 'facilities');
    console.log('已删除 facilities 字段');
    
    await queryInterface.removeColumn('o2o_items', 'orientation');
    console.log('已删除 orientation 字段');
    
    await queryInterface.removeColumn('o2o_items', 'floor');
    console.log('已删除 floor 字段');
    
    await queryInterface.removeColumn('o2o_items', 'area');
    console.log('已删除 area 字段');
    
    await queryInterface.removeColumn('o2o_items', 'room_config');
    console.log('已删除 room_config 字段');
    
    await queryInterface.removeColumn('o2o_items', 'house_type');
    console.log('已删除 house_type 字段');
    
    await queryInterface.removeColumn('o2o_items', 'deposit');
    console.log('已删除 deposit 字段');
    
    console.log('O2O租房信息字段回滚完成');
  }
};