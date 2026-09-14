const { Activity, User, UserProfile, ActivityParticipant } = require('../models');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 12, sortBy = 'time', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Activity.findAndCountAll({
      where: { status: 'published' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['nickname', 'avatar'] }]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const currentUserId = req.user?.id || null;
    const joinedActivityIdSet = new Set();

    if (currentUserId && rows.length) {
      const records = await ActivityParticipant.findAll({
        where: {
          user_id: currentUserId,
          activity_id: rows.map((item) => item.id)
        },
        attributes: ['activity_id']
      });
      records.forEach((record) => joinedActivityIdSet.add(Number(record.activity_id)));
    }

    res.json({
      activities: rows.map(a => ({
        ...a.toJSON(),
        publisher: {
          id: a.user?.id,
          username: a.user?.username,
          nickname: a.user?.profile?.nickname || a.user?.username,
          avatar: a.user?.profile?.avatar || null
        },
        is_joined: joinedActivityIdSet.has(Number(a.id))
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('获取活动失败:', err);
    res.status(500).json({ error: '获取活动失败' });
  }
};

async function fetchParticipants(activityId) {
  const participantRecords = await ActivityParticipant.findAll({
    where: { activity_id: activityId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
        include: [{ model: UserProfile, as: 'profile', attributes: ['nickname', 'avatar'] }]
      }
    ],
    order: [['created_at', 'ASC']]
  });

  return participantRecords
    .filter((record) => record.user)
    .map((record) => ({
      id: record.user.id,
      username: record.user.username,
      nickname: record.user.profile?.nickname || record.user.username,
      avatar: record.user.profile?.avatar || null,
      joined_at: record.created_at
    }));
}

exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['nickname', 'avatar'] }]
        }
      ]
    });

    if (!activity || activity.status !== 'published') {
      return res.status(404).json({ error: '活动不存在' });
    }

    const activityData = activity.toJSON();
    const participants = await fetchParticipants(id);

    const currentUserId = req.user?.id;
    const isJoined = currentUserId
      ? participants.some((participant) => participant.id === currentUserId)
      : false;

    res.json({
      ...activityData,
      publisher: {
        id: activity.user?.id,
        username: activity.user?.username,
        nickname: activity.user?.profile?.nickname || activity.user?.username,
        avatar: activity.user?.profile?.avatar || null
      },
      participants,
      is_joined: isJoined
    });
  } catch (err) {
    console.error('获取活动详情失败:', err);
    res.status(500).json({ error: '获取活动详情失败' });
  }
};

exports.getActivityParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id);

    if (!activity || activity.status !== 'published') {
      return res.status(404).json({ error: '活动不存在' });
    }

    const participants = await fetchParticipants(id);

    res.json({
      participants
    });
  } catch (err) {
    console.error('获取活动报名名单失败:', err);
    res.status(500).json({ error: '获取活动报名名单失败' });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const { title, cover_image, location, time, description, max_participants } = req.body;
    const userId = req.user.id;

    if (!title || !time) {
      return res.status(400).json({ error: '标题和时间为必填项' });
    }

    const trimmedTitle = title.trim();

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [trimmedTitle, location, description],
      requestHeaders: req.headers
    });

    const activity = await Activity.create({
      user_id: userId,
      title: trimmedTitle,
      cover_image: cover_image || null,
      location: location || null,
      time: new Date(time),
      description: description || null,
      max_participants: typeof max_participants === 'number' ? max_participants : null
    });

    const created = await Activity.findByPk(activity.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'], include: [{ model: UserProfile, as: 'profile', attributes: ['nickname', 'avatar'] }] }
      ]
    });

    res.status(201).json({
      message: '活动创建成功',
      activity: {
        ...created.toJSON(),
        publisher: {
          id: created.user?.id,
          username: created.user?.username,
          nickname: created.user?.profile?.nickname || created.user?.username,
          avatar: created.user?.profile?.avatar || null
        }
      }
    });
  } catch (err) {
    console.error('创建活动失败:', err);
    if (err instanceof WechatContentSecurityError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    res.status(500).json({ error: '创建活动失败' });
  }
};

exports.toggleJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const activity = await Activity.findByPk(id);
    if (!activity || activity.status !== 'published') {
      return res.status(404).json({ error: '活动不存在' });
    }

    const existing = await ActivityParticipant.findOne({ where: { activity_id: id, user_id: userId } });
    if (existing) {
      await existing.destroy();
      await activity.decrement('participant_count');
      const updated = await Activity.findByPk(id);
      return res.json({ message: '已取消报名', joined: false, participant_count: updated.participant_count });
    }

    // 未报名，检查名额
    if (activity.max_participants != null && activity.participant_count >= activity.max_participants) {
      return res.status(400).json({ error: '名额已满' });
    }

    await ActivityParticipant.create({ activity_id: id, user_id: userId });
    await activity.increment('participant_count');
    const updated = await Activity.findByPk(id);
    return res.json({ message: '报名成功', joined: true, participant_count: updated.participant_count });
  } catch (err) {
    console.error('报名操作失败:', err);
    // 处理唯一约束竞态
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(200).json({ message: '已报名', joined: true });
    }
    res.status(500).json({ error: '报名操作失败' });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const activity = await Activity.findByPk(id);
    if (!activity || activity.status !== 'published') {
      return res.status(404).json({ error: '活动不存在' });
    }

    if (activity.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '无权限删除该活动' });
    }

    await activity.update({ status: 'deleted' });

    res.json({ message: '活动已删除' });
  } catch (err) {
    console.error('删除活动失败:', err);
    res.status(500).json({ error: '删除活动失败' });
  }
};
