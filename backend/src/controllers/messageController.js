const { Op } = require('sequelize');
const {
  sequelize,
  Conversation,
  Message,
  User,
  UserProfile
} = require('../models');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

const normalizeParticipants = (userId1, userId2) => {
  const sorted = [userId1, userId2].sort((a, b) => Number(a) - Number(b));
  return { userAId: sorted[0], userBId: sorted[1] };
};

const findConversation = async (currentUserId, targetUserId, trx) => {
  const { userAId, userBId } = normalizeParticipants(currentUserId, targetUserId);
  return Conversation.findOne({
    where: {
      user_a_id: userAId,
      user_b_id: userBId
    },
    transaction: trx
  });
};

const findOrCreateConversation = async (currentUserId, targetUserId, trx) => {
  const existing = await findConversation(currentUserId, targetUserId, trx);
  if (existing) {
    return existing;
  }
  const { userAId, userBId } = normalizeParticipants(currentUserId, targetUserId);
  return Conversation.create(
    {
      user_a_id: userAId,
      user_b_id: userBId
    },
    { transaction: trx }
  );
};

const mapMessageToResponse = (message) => {
  const senderProfile = message.sender?.profile;
  const receiverProfile = message.receiver?.profile;

  return {
    id: message.id,
    conversationId: message.conversation_id,
    sender: {
      id: message.sender_id,
      username: message.sender?.username,
      nickname: senderProfile?.nickname || message.sender?.username,
      avatar: senderProfile?.avatar || null
    },
    receiver: {
      id: message.receiver_id,
      username: message.receiver?.username,
      nickname: receiverProfile?.nickname || message.receiver?.username,
      avatar: receiverProfile?.avatar || null
    },
    content: message.content,
    status: message.status,
    createdAt: message.created_at
  };
};

const mapConversationSummary = (conversation, currentUserId, targetUser) => {
  const isUserA = conversation.user_a_id === currentUserId;
  const unread = isUserA ? conversation.unread_a : conversation.unread_b;

  return {
    id: conversation.id,
    targetUser: targetUser
      ? {
          id: targetUser.id,
          username: targetUser.username,
          nickname: targetUser.profile?.nickname || targetUser.username,
          avatar: targetUser.profile?.avatar || null
        }
      : null,
    lastMessageAt: conversation.last_message_at,
    unread
  };
};

exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid target user' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: '不能给自己发送私信' });
    }

    const targetUser = await User.findByPk(targetUserId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['nickname', 'avatar']
        }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: '目标用户不存在' });
    }

    const conversation = await findOrCreateConversation(currentUserId, targetUserId);

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const beforeId = req.query.beforeId ? parseInt(req.query.beforeId, 10) : null;

    const whereClause = { conversation_id: conversation.id };
    if (beforeId) {
      whereClause.id = { [Op.lt]: beforeId };
    }

    const rawMessages = await Message.findAll({
      where: whereClause,
      order: [['id', 'DESC']],
      limit: limit + 1,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });

    const hasMore = rawMessages.length > limit;
    const messages = (hasMore ? rawMessages.slice(0, limit) : rawMessages)
      .map(mapMessageToResponse)
      .reverse();

    res.json({
      conversation: mapConversationSummary(conversation, currentUserId, targetUser),
      messages,
      pagination: {
        hasMore,
        nextBeforeId: messages.length ? messages[0].id : null
      }
    });
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
};

exports.sendMessage = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);
    const content = (req.body.content || '').trim();

    if (!targetUserId || Number.isNaN(targetUserId)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid target user' });
    }

    if (targetUserId === currentUserId) {
      await transaction.rollback();
      return res.status(400).json({ error: '不能给自己发送私信' });
    }

    if (!content) {
      await transaction.rollback();
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    if (content.length > 500) {
      await transaction.rollback();
      return res.status(400).json({ error: '消息内容过长，最多500字符' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 2,
      texts: [content],
      requestHeaders: req.headers
    });

    const targetUser = await User.findByPk(targetUserId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['nickname', 'avatar']
        }
      ],
      transaction
    });

    if (!targetUser) {
      await transaction.rollback();
      return res.status(404).json({ error: '目标用户不存在' });
    }

    const conversation = await findOrCreateConversation(currentUserId, targetUserId, transaction);

    const recentMessages = await Message.findAll({
      where: {
        conversation_id: conversation.id
      },
      order: [['id', 'DESC']],
      limit: 10,
      transaction
    });

    let consecutiveSends = 0;
    for (const message of recentMessages) {
      if (message.sender_id === currentUserId) {
        consecutiveSends += 1;
      } else {
        break;
      }
    }

    if (consecutiveSends >= 2) {
      await transaction.rollback();
      return res.status(400).json({ error: '等待对方回复后再继续发送消息' });
    }

    const newMessage = await Message.create(
      {
        conversation_id: conversation.id,
        sender_id: currentUserId,
        receiver_id: targetUserId,
        content,
        status: 'sent'
      },
      { transaction }
    );

    const isSenderA = conversation.user_a_id === currentUserId;
    const updatePayload = {
      last_message_id: newMessage.id,
      last_message_at: newMessage.created_at,
      unread_a: isSenderA ? 0 : conversation.unread_a + 1,
      unread_b: isSenderA ? conversation.unread_b + 1 : 0
    };

    await conversation.update(updatePayload, { transaction });

    const hydratedMessage = await Message.findByPk(newMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      message: mapMessageToResponse(hydratedMessage),
      conversation: mapConversationSummary(
        conversation,
        currentUserId,
        targetUser
      )
    });
  } catch (error) {
    console.error('发送私信失败:', error);
    await transaction.rollback();
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '发送私信失败' });
  }
};

exports.markAsRead = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid target user' });
    }

    const conversation = await findConversation(currentUserId, targetUserId, transaction);

    if (!conversation) {
      await transaction.rollback();
      return res.status(404).json({ error: '会话不存在' });
    }

    const isUserA = conversation.user_a_id === currentUserId;
    const unreadField = isUserA ? 'unread_a' : 'unread_b';

    await Message.update(
      { status: 'read' },
      {
        where: {
          conversation_id: conversation.id,
          receiver_id: currentUserId,
          status: { [Op.ne]: 'read' }
        },
        transaction
      }
    );

    await conversation.update(
      {
        [unreadField]: 0
      },
      { transaction }
    );

    await transaction.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('标记私信已读失败:', error);
    await transaction.rollback();
    res.status(500).json({ error: '标记私信已读失败' });
  }
};

exports.getUnreadSummary = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          {
            user_a_id: currentUserId,
            unread_a: { [Op.gt]: 0 }
          },
          {
            user_b_id: currentUserId,
            unread_b: { [Op.gt]: 0 }
          }
        ]
      }
    });

    const summary = conversations.map((conversation) => {
      const isUserA = conversation.user_a_id === currentUserId;
      const unread = isUserA ? conversation.unread_a : conversation.unread_b;
      const userId = isUserA ? conversation.user_b_id : conversation.user_a_id;
      return {
        userId,
        unread,
        lastMessageAt: conversation.last_message_at
      };
    });

    res.json({ summary });
  } catch (error) {
    console.error('获取未读私信失败:', error);
    res.status(500).json({ error: '获取未读私信失败' });
  }
};
