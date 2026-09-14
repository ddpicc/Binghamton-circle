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

const { User, Circle, CircleCategory, CircleMember, Post, Notice, Comment, Like } = require('../src/models');

async function createTestData() {
  try {
    console.log('开始创建测试数据...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 获取测试用户
    const user = await User.findOne({
      where: { email: 'test1@ivyelite.net' }
    });
    
    if (!user) {
      console.log('请先运行 node createAdmin.js 创建测试用户！');
      process.exit(1);
    }
    
    console.log('使用测试用户:', user.email);
    
    // 获取或创建圈子分类
    let categories = await CircleCategory.findAll();
    
    if (categories.length === 0) {
      categories = await CircleCategory.bulkCreate([
        { name: '学习交流', icon: 'Book', circle_count: 0 },
        { name: '生活分享', icon: 'Coffee', circle_count: 0 },
        { name: '兴趣小组', icon: 'Star', circle_count: 0 },
        { name: '校园活动', icon: 'Calendar', circle_count: 0 },
        { name: '求职招聘', icon: 'Briefcase', circle_count: 0 }
      ]);
      console.log('圈子分类创建成功');
    } else {
      console.log('圈子分类已存在');
    }
    
    // 创建测试圈子
    const circles = await Circle.bulkCreate([
      {
        name: '编程学习交流',
        description: '分享编程经验，讨论技术问题，一起学习进步',
        category_id: categories[0].id,
        creator_id: user.id,
        is_private: false,
        rules: '1. 友好交流\n2. 禁止广告\n3. 分享有价值的内容',
        member_count: 1,
        post_count: 0,
        status: 'active'
      },
      {
        name: '美食分享',
        description: '分享校园周边美食，交流烹饪心得',
        category_id: categories[1].id,
        creator_id: user.id,
        is_private: false,
        rules: '分享美食，传递快乐',
        member_count: 1,
        post_count: 0,
        status: 'active'
      },
      {
        name: '摄影爱好者',
        description: '摄影作品分享，技巧交流',
        category_id: categories[2].id,
        creator_id: user.id,
        is_private: false,
        rules: '原创作品，尊重版权',
        member_count: 1,
        post_count: 0,
        status: 'active'
      },
      {
        name: '校园活动组织',
        description: '组织各类校园活动，让大学生活更精彩',
        category_id: categories[3].id,
        creator_id: user.id,
        is_private: false,
        rules: '积极组织，安全第一',
        member_count: 1,
        post_count: 0,
        status: 'active'
      },
      {
        name: '实习求职内推',
        description: '分享实习信息，内推机会',
        category_id: categories[4].id,
        creator_id: user.id,
        is_private: true,
        rules: '真实信息，诚信交流',
        member_count: 1,
        post_count: 0,
        status: 'active'
      }
    ]);
    
    console.log('测试圈子创建成功');
    
    // 用户加入自己创建的圈子
    for (const circle of circles) {
      await CircleMember.create({
        circle_id: circle.id,
        user_id: user.id,
        role: 'creator',
        status: 'approved'
      });
    }
    
    // 创建测试帖子
    const posts = await Post.bulkCreate([
      {
        user_id: user.id,
        circle_id: circles[0].id,
        title: 'Vue 3 组合式 API 最佳实践',
        content: '最近在学习 Vue 3 的组合式 API，感觉相比选项式 API 更加灵活和强大。特别是响应式系统的重构，让代码组织更加清晰。大家在使用组合式 API 时有什么心得体会吗？',
        status: 'published',
        is_anonymous: false,
        like_count: 0,
        comment_count: 0
      },
      {
        user_id: user.id,
        circle_id: circles[1].id,
        title: '学校附近好吃的拉面店推荐',
        content: '发现了一家超好吃的拉面店，就在学校东门对面。汤头浓郁，面条劲道，最重要的是价格实惠！推荐给大家，地址是...',
        status: 'published',
        is_anonymous: false,
        like_count: 0,
        comment_count: 0
      },
      {
        user_id: user.id,
        circle_id: circles[2].id,
        title: '分享一组校园秋景照片',
        content: '这个周末在校园里拍了一组秋景，金黄的落叶配上古老的建筑，特别有感觉。器材用的是索尼 A7M3，镜头是 24-70mm F2.8。',
        status: 'published',
        is_anonymous: false,
        like_count: 0,
        comment_count: 0
      }
    ]);
    
    console.log('测试帖子创建成功');
    
    // 更新圈子的帖子计数
    for (let i = 0; i < circles.length; i++) {
      if (i < 3) {
        await circles[i].increment('post_count');
      }
    }
    
    // 创建测试通知
    const notices = await Notice.bulkCreate([
      {
        user_id: user.id,
        title: '系统维护通知',
        content: '系统将于本周六凌晨2:00-4:00进行维护升级，期间服务将暂时无法使用。请提前做好准备，给您带来的不便敬请谅解。',
        type: 'system',
        priority: 'high',
        status: 'published',
        author: '系统管理员'
      },
      {
        user_id: user.id,
        title: '校园摄影大赛开始报名',
        content: '一年一度的校园摄影大赛即将开始！本次大赛主题为"秋日校园"，欢迎所有摄影爱好者参加。丰厚奖品等你来拿！',
        type: 'activity',
        priority: 'medium',
        status: 'published',
        author: '学生会'
      },
      {
        user_id: user.id,
        title: '新生选课指南',
        content: '新学期选课即将开始，为了让新生更好地了解选课流程和注意事项，特整理了这份选课指南。包括选课时间、课程推荐、老师评价等内容。',
        type: 'academic',
        priority: 'medium',
        status: 'published',
        author: '教务处'
      }
    ]);
    
    console.log('测试通知创建成功');
    
    // 创建一些评论
    const comments = await Comment.bulkCreate([
      {
        user_id: user.id,
        post_id: posts[0].id,
        content: '确实，组合式 API 的代码复用性更强，特别是通过自定义 hooks 的方式。',
        like_count: 0
      },
      {
        user_id: user.id,
        post_id: posts[1].id,
        content: '谢谢推荐！周末一定去试试看。',
        like_count: 0
      }
    ]);
    
    console.log('测试评论创建成功');
    
    // 更新帖子的评论计数
    await posts[0].increment('comment_count');
    await posts[1].increment('comment_count');
    
    console.log('\n所有测试数据创建完成！');
    console.log('========================');
    console.log('使用测试账号: test1@ivyelite.net');
    console.log('\n创建了以下数据:');
    console.log('- 5个圈子（包含1个私密圈子）');
    console.log('- 3篇帖子');
    console.log('- 3条通知');
    console.log('- 2条评论');
    
    process.exit(0);
  } catch (error) {
    console.error('创建测试数据失败:', error);
    process.exit(1);
  }
}

createTestData();