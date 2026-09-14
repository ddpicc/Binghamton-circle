const bcrypt = require('bcryptjs')
const {
  sequelize,
  User,
  UserProfile,
  CircleCategory,
  Circle,
  CircleMember,
  Post,
  Comment,
  Like,
  Notice,
  O2OCategory,
  O2OItem,
  TreeHolePost,
  TreeHoleComment,
  TreeHoleLike,
  Activity,
  ActivityParticipant,
  LifeMapPoint,
  LifeMapPointSubmission,
  Conversation,
  Message,
  BlockedKeyword,
  NonEduEmailRequest,
  EmailVerificationToken
} = require('../src/models')

function d(value) {
  return new Date(value)
}

function daysFromNow(days, hours = 0, minutes = 0) {
  const now = new Date()
  now.setDate(now.getDate() + days)
  now.setHours(hours, minutes, 0, 0)
  return now
}

async function clearAllBusinessData() {
  const [rows] = await sequelize.query(`
    SELECT table_name AS tableName
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
  `)

  const keep = new Set(['sequelize_meta'])
  const tables = rows
    .map((row) => row.tableName)
    .filter((name) => !keep.has(name))

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of tables) {
    await sequelize.query(`TRUNCATE TABLE \`${table}\``)
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
}

async function main() {
  await sequelize.authenticate()
  await clearAllBusinessData()

  const passwordHash = await bcrypt.hash('Demo@123456', 10)

  const users = await User.bulkCreate(
    [
      { username: 'admin', primary_email: 'admin@binghamton.edu', password: passwordHash, role: 'admin', status: 'active', email_verified: true },
      { username: 'testuser', primary_email: 'testuser@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'alex', primary_email: 'alex@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'emily', primary_email: 'emily@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'jason', primary_email: 'jason@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'mia', primary_email: 'mia@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'owen', primary_email: 'owen@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'lucy', primary_email: 'lucy@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'kevin', primary_email: 'kevin@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true },
      { username: 'zoe', primary_email: 'zoe@binghamton.edu', password: passwordHash, role: 'user', status: 'active', email_verified: true }
    ],
    { returning: true }
  )

  const userByName = Object.fromEntries(users.map((u) => [u.username, u]))

  await UserProfile.bulkCreate([
    { user_id: userByName.admin.id, nickname: 'admin', avatar: 'https://i.pravatar.cc/120?img=12', bio: '系统管理员', school: 'Binghamton University', major: 'Information Systems', grade: 'Graduate' },
    { user_id: userByName.testuser.id, nickname: 'testuser', avatar: 'https://i.pravatar.cc/120?img=32', bio: '爱摄影爱生活', school: 'Binghamton University', major: 'Computer Science', grade: 'Junior' },
    { user_id: userByName.alex.id, nickname: 'Alex Harrington', avatar: 'https://i.pravatar.cc/120?img=54', bio: '活动组织者', school: 'Binghamton University', major: 'Business', grade: 'Senior' },
    { user_id: userByName.emily.id, nickname: 'Emily C.', avatar: 'https://i.pravatar.cc/120?img=48', bio: '手工社成员', school: 'Binghamton University', major: 'Art', grade: 'Sophomore' },
    { user_id: userByName.jason.id, nickname: 'J. Wilson', avatar: 'https://i.pravatar.cc/120?img=15', bio: '音乐发烧友', school: 'Binghamton University', major: 'Music', grade: 'Senior' },
    { user_id: userByName.mia.id, nickname: 'Mia', avatar: 'https://i.pravatar.cc/120?img=23', bio: '二手达人', school: 'Binghamton University', major: 'Data Science', grade: 'Junior' },
    { user_id: userByName.owen.id, nickname: 'Owen', avatar: 'https://i.pravatar.cc/120?img=64', bio: '跑步爱好者', school: 'Binghamton University', major: 'Mechanical Engineering', grade: 'Senior' },
    { user_id: userByName.lucy.id, nickname: 'Lucy', avatar: 'https://i.pravatar.cc/120?img=27', bio: '校园生活记录者', school: 'Binghamton University', major: 'Media', grade: 'Sophomore' },
    { user_id: userByName.kevin.id, nickname: 'Kevin', avatar: 'https://i.pravatar.cc/120?img=68', bio: '租房互助群群主', school: 'Binghamton University', major: 'Finance', grade: 'Graduate' },
    { user_id: userByName.zoe.id, nickname: 'Zoe', avatar: 'https://i.pravatar.cc/120?img=5', bio: '热心学姐', school: 'Binghamton University', major: 'Psychology', grade: 'Senior' }
  ])

  const circleCategories = await CircleCategory.bulkCreate([
    { name: '社交', description: '校园社交与兴趣交流', icon: 'group_work', sort_order: 1, is_active: true },
    { name: '学习', description: '课程与学习互助', icon: 'school', sort_order: 2, is_active: true },
    { name: '生活', description: '租房、美食、出行等', icon: 'forest', sort_order: 3, is_active: true },
    { name: '活动', description: '校园活动与社团', icon: 'event', sort_order: 4, is_active: true }
  ], { returning: true })
  const catByName = Object.fromEntries(circleCategories.map((c) => [c.name, c]))

  const circles = []
  circles.push(await Circle.create({
    name: '自然与校园摄影',
    description: '记录Binghamton四季与校园日常，欢迎分享作品与参数。',
    cover_image: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&q=80',
    creator_id: userByName.testuser.id,
    category_id: catByName.社交.id,
    tags: ['摄影', '校园', '风景'],
    is_public: true,
    need_approval: false,
    member_count: 0,
    post_count: 0,
    status: 'active'
  }))
  circles.push(await Circle.create({
    name: '心理学荣誉学会',
    description: '心理学学术分享、活动组织与资源互助。',
    cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    creator_id: userByName.zoe.id,
    category_id: catByName.学习.id,
    tags: ['心理学', '学术', '分享'],
    is_public: true,
    need_approval: true,
    member_count: 0,
    post_count: 0,
    status: 'active'
  }))
  circles.push(await Circle.create({
    name: '租房互助站',
    description: '租房避坑、转租信息和生活互助。',
    cover_image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    creator_id: userByName.kevin.id,
    category_id: catByName.生活.id,
    tags: ['租房', '转租', '生活'],
    is_public: true,
    need_approval: false,
    member_count: 0,
    post_count: 0,
    status: 'active'
  }))

  for (const circle of circles) {
    await CircleMember.create({ circle_id: circle.id, user_id: circle.creator_id, role: 'creator', status: 'approved' })
  }
  await CircleMember.bulkCreate([
    { circle_id: circles[0].id, user_id: userByName.alex.id, role: 'member', status: 'approved' },
    { circle_id: circles[0].id, user_id: userByName.emily.id, role: 'member', status: 'approved' },
    { circle_id: circles[0].id, user_id: userByName.mia.id, role: 'member', status: 'approved' },
    { circle_id: circles[1].id, user_id: userByName.testuser.id, role: 'admin', status: 'approved' },
    { circle_id: circles[1].id, user_id: userByName.lucy.id, role: 'member', status: 'approved' },
    { circle_id: circles[2].id, user_id: userByName.owen.id, role: 'member', status: 'approved' },
    { circle_id: circles[2].id, user_id: userByName.jason.id, role: 'member', status: 'approved' }
  ])

  const posts = await Post.bulkCreate([
    {
      user_id: userByName.testuser.id,
      title: '今天晚霞太美了，图书馆后面拍到的',
      content: '逆光下的云层层次非常好看，参数：35mm f2.0 1/250 ISO100。',
      images: ['https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1200&q=80'],
      category: '摄影',
      tags: ['晚霞', '校园摄影'],
      circle_id: circles[0].id,
      like_count: 12,
      comment_count: 2,
      view_count: 128,
      status: 'published'
    },
    {
      user_id: userByName.zoe.id,
      title: '本周心理学读书会主题：社会认知',
      content: '周五晚7点，心理楼201，欢迎带着你最近读到的论文来讨论。',
      images: [],
      category: '学习',
      tags: ['读书会', '心理学'],
      circle_id: circles[1].id,
      like_count: 8,
      comment_count: 1,
      view_count: 79,
      status: 'published'
    },
    {
      user_id: userByName.kevin.id,
      title: '靠近校车站2b1b转租，5月可入住',
      content: '家具齐全，步行8分钟到校车站，支持看房。',
      images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80'],
      category: '生活',
      tags: ['转租', '2b1b'],
      circle_id: circles[2].id,
      like_count: 17,
      comment_count: 4,
      view_count: 230,
      status: 'published'
    }
  ], { returning: true })

  await Comment.bulkCreate([
    { post_id: posts[0].id, user_id: userByName.alex.id, content: '这个机位绝了！', is_anonymous: false, like_count: 1, status: 'published' },
    { post_id: posts[0].id, user_id: userByName.emily.id, content: '颜色太干净了，赞。', is_anonymous: false, like_count: 0, status: 'published' },
    { post_id: posts[1].id, user_id: userByName.lucy.id, content: '我会带一篇相关论文来分享。', is_anonymous: false, like_count: 0, status: 'published' }
  ])

  await Like.bulkCreate([
    { user_id: userByName.alex.id, target_id: posts[0].id, target_type: 'post' },
    { user_id: userByName.emily.id, target_id: posts[0].id, target_type: 'post' },
    { user_id: userByName.mia.id, target_id: posts[2].id, target_type: 'post' }
  ])

  await Notice.bulkCreate([
    {
      user_id: userByName.admin.id,
      title: '2026春季学期选课时间提醒',
      content: '请同学们于本周三前完成选课，逾期系统将关闭。',
      category: '教务',
      priority: 'high',
      is_pinned: true,
      is_published: true,
      publish_time: daysFromNow(-2, 9, 0),
      view_count: 320,
      status: 'published'
    },
    {
      user_id: userByName.admin.id,
      title: '图书馆夜间开放时段调整',
      content: '期中周期间图书馆延长至凌晨1点闭馆。',
      category: '校园',
      priority: 'medium',
      is_pinned: false,
      is_published: true,
      publish_time: daysFromNow(-1, 10, 30),
      view_count: 183,
      status: 'published'
    },
    {
      user_id: userByName.admin.id,
      title: '本周末校园二手集市招募摊主',
      content: '欢迎同学报名摆摊，提供桌椅和基础物料。',
      category: '活动',
      priority: 'medium',
      is_pinned: false,
      is_published: true,
      publish_time: daysFromNow(-1, 14, 0),
      view_count: 139,
      status: 'published'
    }
  ])

  const o2oCategories = await O2OCategory.bulkCreate([
    { code: 'second_hand', name: '二手', description: '二手交易', icon: 'storefront', is_active: true, sort_order: 1 },
    { code: 'rental', name: '租房', description: '租房信息', icon: 'home', is_active: true, sort_order: 2 }
  ], { returning: true })
  const o2oByCode = Object.fromEntries(o2oCategories.map((c) => [c.code, c]))

  await O2OItem.bulkCreate([
    {
      user_id: userByName.testuser.id,
      title: '苹果笔记本电脑',
      description: 'M2 8+256G，正常使用痕迹，电池健康良好。',
      category_id: o2oByCode.second_hand.id,
      price: 800,
      original_price: 999,
      price_type: 'fixed',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80'],
      contact_info: { wechat: 'testuser1' },
      location: '学生活动中心',
      condition: 'like_new',
      tags: ['笔记本', '苹果'],
      status: 'available',
      view_count: 174,
      like_count: 12
    },
    {
      user_id: userByName.admin.id,
      title: 'CS基础课原版教材合集',
      description: '离散数学、数据库系统、操作系统三本，附带课堂笔记。',
      category_id: o2oByCode.second_hand.id,
      price: 45,
      price_type: 'fixed',
      images: ['https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&q=80'],
      contact_info: { wechat: 'admin_books' },
      location: '图书馆门口',
      condition: 'good',
      tags: ['教材', '计算机'],
      status: 'available',
      view_count: 160,
      like_count: 8
    },
    {
      user_id: userByName.emily.id,
      title: '单间转租，近北校区体育馆',
      description: '4月起租，家具齐全，包水网。',
      category_id: o2oByCode.rental.id,
      price: 650,
      deposit: 650,
      house_type: 'single',
      room_config: '1室1卫',
      area: 22.5,
      floor: '3/5',
      orientation: 'south',
      facilities: ['空调', '洗衣机', '书桌'],
      move_in_date: daysFromNow(10, 0, 0),
      min_lease: '6个月',
      price_type: 'negotiable',
      images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80'],
      contact_info: { wechat: 'emily_rent' },
      location: 'North Side',
      condition: 'good',
      tags: ['转租', '近校区'],
      status: 'available',
      view_count: 213,
      like_count: 15
    },
    {
      user_id: userByName.mia.id,
      title: 'Nike 运动鞋 Size 42',
      description: '仅试穿一次，几乎全新。',
      category_id: o2oByCode.second_hand.id,
      price: 350,
      price_type: 'fixed',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80'],
      contact_info: { wechat: 'mia_sneaker' },
      location: 'Union',
      condition: 'like_new',
      tags: ['球鞋'],
      status: 'available',
      view_count: 96,
      like_count: 5
    }
  ])

  const treePosts = await TreeHolePost.bulkCreate([
    {
      user_id: userByName.testuser.id,
      content: '最近课业压力有点大，但今天傍晚的风很温柔，突然又觉得可以坚持一下。',
      images: [],
      tags: ['学习', '心情'],
      like_count: 8,
      comment_count: 2,
      view_count: 140,
      status: 'published',
      is_pinned: false
    },
    {
      user_id: userByName.lucy.id,
      content: '谢谢昨天在图书馆帮我找资料的同学，陌生人的善意真的会发光。',
      images: [],
      tags: ['感谢', '日常'],
      like_count: 12,
      comment_count: 1,
      view_count: 102,
      status: 'published',
      is_pinned: false
    },
    {
      user_id: userByName.owen.id,
      content: '夜跑完抬头看到星星，突然觉得烦恼没有那么可怕。',
      images: ['https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80'],
      tags: ['夜跑', '治愈'],
      like_count: 21,
      comment_count: 3,
      view_count: 198,
      status: 'published',
      is_pinned: true
    }
  ], { returning: true })

  await TreeHoleComment.bulkCreate([
    { post_id: treePosts[0].id, user_id: userByName.zoe.id, content: '你已经很棒了，记得按时休息。', status: 'published' },
    { post_id: treePosts[0].id, user_id: userByName.alex.id, content: '加油，期中后一起吃顿好的。', status: 'published' },
    { post_id: treePosts[2].id, user_id: userByName.emily.id, content: '这条好治愈！', status: 'published' }
  ])

  await TreeHoleLike.bulkCreate([
    { user_id: userByName.alex.id, target_id: treePosts[0].id, target_type: 'post' },
    { user_id: userByName.emily.id, target_id: treePosts[0].id, target_type: 'post' },
    { user_id: userByName.jason.id, target_id: treePosts[1].id, target_type: 'post' },
    { user_id: userByName.mia.id, target_id: treePosts[2].id, target_type: 'post' },
    { user_id: userByName.zoe.id, target_id: treePosts[2].id, target_type: 'post' }
  ])

  const activities = await Activity.bulkCreate([
    {
      user_id: userByName.alex.id,
      title: '春季草坪音乐节 · 2024',
      cover_image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80',
      location: '中央图书馆东侧大草坪',
      time: d('2026-03-23T14:00:00'),
      description: '不插电现场、草坪市集、落日合唱。',
      participant_count: 156,
      max_participants: 300,
      status: 'published'
    },
    {
      user_id: userByName.testuser.id,
      title: '创新创业校友沙龙：从0到1',
      cover_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
      location: '学生活动中心 302 报告厅',
      time: d('2026-03-24T14:00:00'),
      description: '邀请校友分享创业路径与资源链接。',
      participant_count: 56,
      max_participants: 120,
      status: 'published'
    },
    {
      user_id: userByName.owen.id,
      title: '落日余晖：环校夜跑计划',
      cover_image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80',
      location: '北校区体育场大门',
      time: d('2026-03-25T18:30:00'),
      description: '5公里轻松跑，欢迎新手。',
      participant_count: 30,
      max_participants: 80,
      status: 'published'
    },
    {
      user_id: userByName.emily.id,
      title: '周末手工工坊：扎染艺术体验',
      cover_image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&q=80',
      location: '艺术学院 101 工作室',
      time: d('2026-03-27T09:00:00'),
      description: '提供材料，成品可带走。',
      participant_count: 18,
      max_participants: 30,
      status: 'published'
    }
  ], { returning: true })

  await ActivityParticipant.bulkCreate([
    { activity_id: activities[0].id, user_id: userByName.testuser.id },
    { activity_id: activities[0].id, user_id: userByName.emily.id },
    { activity_id: activities[0].id, user_id: userByName.jason.id },
    { activity_id: activities[1].id, user_id: userByName.alex.id },
    { activity_id: activities[1].id, user_id: userByName.mia.id },
    { activity_id: activities[2].id, user_id: userByName.lucy.id },
    { activity_id: activities[2].id, user_id: userByName.kevin.id },
    { activity_id: activities[3].id, user_id: userByName.zoe.id }
  ])

  await LifeMapPoint.bulkCreate([
    { name: 'Moonbear Cafe', description: '咖啡与轻食，适合学习。', category: 'food', latitude: 42.0892001, longitude: -75.9693002, address: 'Downtown Binghamton', phone: '607-111-1001', tags: ['咖啡', '学习'], status: 'active', created_by: userByName.testuser.id },
    { name: 'Campus Grocery', description: '日常补给。', category: 'grocery', latitude: 42.0888001, longitude: -75.9712002, address: 'Near Main St', phone: '607-111-1002', tags: ['超市'], status: 'active', created_by: userByName.mia.id },
    { name: 'Tech Print Service', description: '打印扫描。', category: 'service', latitude: 42.0910001, longitude: -75.9701002, address: 'University Plaza', phone: '607-111-1003', tags: ['打印'], status: 'active', created_by: userByName.alex.id },
    { name: 'Old Union Gate', description: '校园打卡点。', category: 'campus', latitude: 42.0905001, longitude: -75.9688002, address: 'Campus West', tags: ['地标'], status: 'active', created_by: userByName.lucy.id }
  ])

  await LifeMapPointSubmission.bulkCreate([
    {
      name: 'Late Night Noodles',
      description: '晚上营业到凌晨，适合夜猫子。',
      category: 'food',
      latitude: 42.0878001,
      longitude: -75.9708002,
      address: 'Court St',
      tags: ['夜宵', '面食'],
      submitted_by: userByName.owen.id,
      status: 'pending'
    }
  ])

  const conversation = await Conversation.create({
    user_a_id: Math.min(userByName.testuser.id, userByName.alex.id),
    user_b_id: Math.max(userByName.testuser.id, userByName.alex.id),
    unread_a: 0,
    unread_b: 1,
    last_message_at: daysFromNow(-1, 20, 30)
  })

  const msg1 = await Message.create({
    conversation_id: conversation.id,
    sender_id: userByName.testuser.id,
    receiver_id: userByName.alex.id,
    content: '周三活动海报我做好了，你看看要不要改颜色？',
    status: 'read'
  })
  const msg2 = await Message.create({
    conversation_id: conversation.id,
    sender_id: userByName.alex.id,
    receiver_id: userByName.testuser.id,
    content: '很好看，明早我发到群里。',
    status: 'sent'
  })
  await conversation.update({
    last_message_id: msg2.id,
    last_message_at: new Date(),
    unread_a: 1,
    unread_b: 0
  })

  await BlockedKeyword.bulkCreate([
    { keyword: '诈骗', type: 'partial', action: 'mark', reason: '风险内容', is_active: true },
    { keyword: '代考', type: 'exact', action: 'block', reason: '违规内容', is_active: true },
    { keyword: '赌博', type: 'partial', action: 'block', reason: '违法内容', is_active: true }
  ])

  const nonEdu = await NonEduEmailRequest.create({
    requested_username: 'guest_mike',
    personal_email: 'mike.demo@gmail.com',
    reason: '校外合作项目沟通需要',
    status: 'approved',
    admin_id: userByName.admin.id,
    admin_note: '已通过演示申请',
    approved_at: daysFromNow(-2, 11, 0)
  })

  await EmailVerificationToken.create({
    request_id: nonEdu.id,
    user_id: null,
    email: nonEdu.personal_email,
    token_hash: 'demo_token_hash_20260323',
    type: 'non_edu_onboarding',
    expires_at: daysFromNow(2, 23, 59),
    used_at: null
  })

  for (const circle of circles) {
    const memberCount = await CircleMember.count({ where: { circle_id: circle.id, status: 'approved' } })
    const postCount = await Post.count({ where: { circle_id: circle.id, status: 'published' } })
    await circle.update({ member_count: memberCount, post_count: postCount })
  }

  for (const category of circleCategories) {
    const count = await Circle.count({ where: { category_id: category.id, status: 'active' } })
    await category.update({ circle_count: count })
  }

  console.log('Demo seed completed: database cleared and refilled successfully.')
}

main()
  .then(async () => {
    await sequelize.close()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Reset and seed failed:', error)
    try {
      await sequelize.close()
    } catch (closeErr) {
      console.error('Close connection failed:', closeErr)
    }
    process.exit(1)
  })
