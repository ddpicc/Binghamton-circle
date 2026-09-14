const { O2OItem, User, UserProfile, Like, O2OCategory } = require('../models');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

const getCategoryFilterId = (query = {}) => query.category_id || query.category;

const isRentalCategoryRecord = (category) => {
  if (!category) return false;
  return category.code === 'rental'
    || category.name === '租房'
    || category.name === '租房信息'
    || category.description === '租房信息';
};

const buildO2OUserPayload = (user) => ({
  id: user.id,
  username: user.username,
  nickname: user.profile?.nickname || user.username,
  avatar: user.profile?.avatar
});

const buildO2OCategoryPayload = (category) => ({
  id: category.id,
  code: category.code,
  name: category.name,
  description: category.description,
  icon: category.icon
});

/**
 * 获取O2O物品列表
 */
exports.getO2OItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      status = 'available',
      search,
      min_price,
      max_price,
      condition,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    const categoryId = getCategoryFilterId(req.query);

    const offset = (page - 1) * limit;
    const whereClause = { status };

    // 分类筛选
    if (categoryId) {
      whereClause.category_id = categoryId;
    }

    // 类型筛选
    if (type) {
      whereClause.type = type;
    }

    // 价格范围筛选
    if (min_price !== undefined) {
      whereClause.price = { [Op.gte]: parseFloat(min_price) };
    }
    if (max_price !== undefined) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(max_price) };
    }

    // 成色筛选
    if (condition) {
      whereClause.condition = condition;
    }

    // 搜索功能
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } }
      ];
    }

    // 检查过期时间
    whereClause[Op.or] = [
      { expire_date: { [Op.gt]: new Date() } },
      { expire_date: null }
    ];

    const { count, rows: items } = await O2OItem.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'phone']
            }
          ]
        },
        {
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ],
      order: [
        ['is_pinned', 'DESC'],
        ['is_urgent', 'DESC'],
        [sortBy, sortOrder]
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const currentUserId = req.user?.id || null;
    const likedItemIdSet = new Set();

    if (currentUserId && items.length) {
      const likes = await Like.findAll({
        where: {
          user_id: currentUserId,
          target_type: 'o2o_item',
          target_id: items.map((item) => item.id)
        },
        attributes: ['target_id']
      });
      likes.forEach((like) => likedItemIdSet.add(Number(like.target_id)));
    }

    res.json({
      items: items.map(item => ({
        ...item.toJSON(),
        user: buildO2OUserPayload(item.user),
        category: buildO2OCategoryPayload(item.categoryInfo),
        is_liked: likedItemIdSet.has(Number(item.id)),
        like_count: item.like_count || 0
      })),
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取O2O物品列表失败:', error);
    res.status(500).json({ error: '获取O2O物品列表失败' });
  }
};

/**
 * 获取O2O物品详情
 */
exports.getO2OItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await O2OItem.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'primary_email'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'phone', 'bio']
            }
          ]
        },
        {
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }

    // 增加浏览数
    await item.increment('view_count');

    let isLiked = false;
    if (req.user?.id) {
      const liked = await Like.findOne({
        where: {
          user_id: req.user.id,
          target_id: id,
          target_type: 'o2o_item'
        },
        attributes: ['id']
      });
      isLiked = Boolean(liked);
    }

    res.json({
      item: {
        ...item.toJSON(),
        user: {
          ...buildO2OUserPayload(item.user),
          email: item.user.primary_email
        },
        category: buildO2OCategoryPayload(item.categoryInfo),
        is_liked: isLiked,
        like_count: item.like_count || 0
      }
    });
  } catch (error) {
    console.error('获取O2O物品详情失败:', error);
    res.status(500).json({ error: '获取O2O物品详情失败' });
  }
};

/**
 * 创建O2O物品
 */
exports.createO2OItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      category,
      price,
      deposit,
      house_type,
      room_config,
      area,
      floor,
      orientation,
      facilities,
      move_in_date,
      min_lease,
      price_type = 'fixed',
      condition,
      location,
      contact_info,
      tags,
      images,
      expire_date,
      status = 'available'
    } = req.body;
    const userId = req.user.id;

    if (!title || !description || !category_id) {
      return res.status(400).json({ error: '标题、描述和分类不能为空' });
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [trimmedTitle, trimmedDescription, location, contact_info],
      requestHeaders: req.headers
    });

    // 验证价格
    if (price === undefined || price === null) {
      return res.status(400).json({ error: '价格不能为空' });
    }

    // 获取分类信息以确定是否为租房分类
    const categoryInfo = await O2OCategory.findByPk(category_id);
    const isRentalCategory = isRentalCategoryRecord(categoryInfo);

    // 准备物品数据
    const itemData = {
      user_id: userId,
      title: trimmedTitle,
      description: trimmedDescription,
      category_id: category_id,
      price: price || 0,
      location,
      contact_info,
      tags: tags || [],
      images: images || [],
      expire_date,
      status
    };

    // 根据分类类型添加相应字段
    if (isRentalCategory) {
      // 租房信息字段
      itemData.deposit = deposit || 0;
      itemData.house_type = house_type;
      itemData.room_config = room_config;
      itemData.area = area || 0;
      itemData.floor = floor;
      itemData.orientation = orientation;
      itemData.facilities = facilities || [];
      itemData.move_in_date = move_in_date;
      itemData.min_lease = min_lease;
      itemData.price_type = 'fixed'; // 租房默认为固定价格
      itemData.condition = 'new'; // 租房不需要成色
    } else {
      // 其他分类字段
      itemData.price_type = price_type;
      itemData.condition = condition;
    }

    const item = await O2OItem.create(itemData);

    const createdItem = await O2OItem.findByPk(item.id, {
      include: [
        {
          model: User,
          as: 'user',
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
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ]
    });

    res.status(201).json({
      message: '物品发布成功',
      item: {
        ...createdItem.toJSON(),
        user: buildO2OUserPayload(createdItem.user),
        category: buildO2OCategoryPayload(createdItem.categoryInfo),
        is_liked: false,
        like_count: createdItem.like_count || 0
      }
    });
  } catch (error) {
    console.error('创建O2O物品失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '创建O2O物品失败' });
  }
};

/**
 * 更新O2O物品
 */
exports.updateO2OItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      price,
      deposit,
      house_type,
      room_config,
      area,
      floor,
      orientation,
      facilities,
      move_in_date,
      min_lease,
      original_price,
      price_type,
      condition,
      location,
      contact_method,
      tags,
      images,
      status,
      is_urgent,
      expire_date
    } = req.body;
    const userId = req.user.id;

    const item = await O2OItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }

    // 检查权限
    if (item.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限修改此物品' });
    }

    // 获取分类信息以确定是否为租房分类
    const categoryId = category_id !== undefined ? category_id : item.category_id;
    const categoryInfo = await O2OCategory.findByPk(categoryId);
    const isRentalCategory = isRentalCategoryRecord(categoryInfo);
    const nextTitle = typeof title === 'string' ? title.trim() : item.title;
    const nextDescription = typeof description === 'string' ? description.trim() : item.description;
    const nextLocation = location !== undefined ? location : item.location;
    const nextContactInfo = contact_method !== undefined ? contact_method : item.contact_info;

    if (!nextTitle || !nextDescription) {
      return res.status(400).json({ error: '标题、描述不能为空' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [nextTitle, nextDescription, nextLocation, nextContactInfo],
      requestHeaders: req.headers
    });

    // 准备更新数据
    const updateData = {
      title: nextTitle,
      description: nextDescription,
      category_id: categoryId,
      location: nextLocation,
      contact_info: nextContactInfo,
      tags: tags || item.tags,
      images: images || item.images,
      status: status || item.status,
      expire_date: expire_date || item.expire_date
    };

    // 根据分类类型添加相应字段
    if (isRentalCategory) {
      // 租房信息字段
      updateData.price = price !== undefined ? price : item.price;
      updateData.deposit = deposit !== undefined ? deposit : item.deposit;
      updateData.house_type = house_type || item.house_type;
      updateData.room_config = room_config || item.room_config;
      updateData.area = area !== undefined ? area : item.area;
      updateData.floor = floor || item.floor;
      updateData.orientation = orientation || item.orientation;
      updateData.facilities = facilities || item.facilities;
      updateData.move_in_date = move_in_date || item.move_in_date;
      updateData.min_lease = min_lease || item.min_lease;
      updateData.price_type = 'fixed'; // 租房默认为固定价格
      updateData.condition = 'new'; // 租房不需要成色
    } else {
      // 其他分类字段
      updateData.price = price !== undefined ? price : item.price;
      updateData.original_price = original_price !== undefined ? original_price : item.original_price;
      updateData.price_type = price_type || item.price_type;
      updateData.condition = condition || item.condition;
    }

    await item.update(updateData);

    const updatedItem = await O2OItem.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
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
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ]
    });

    res.json({
      message: '物品更新成功',
      item: {
        ...updatedItem.toJSON(),
        user: buildO2OUserPayload(updatedItem.user),
        category: buildO2OCategoryPayload(updatedItem.categoryInfo),
        is_liked: false,
        like_count: updatedItem.like_count || 0
      }
    });
  } catch (error) {
    console.error('更新O2O物品失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '更新O2O物品失败' });
  }
};

/**
 * 删除O2O物品
 */
exports.deleteO2OItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await O2OItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }

    // 检查权限
    if (item.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限删除此物品' });
    }

    await item.update({ status: 'deleted' });

    res.json({ message: '物品删除成功' });
  } catch (error) {
    console.error('删除O2O物品失败:', error);
    res.status(500).json({ error: '删除O2O物品失败' });
  }
};

/**
 * 点赞/取消点赞O2O物品
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await O2OItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        user_id: userId,
        target_id: id,
        target_type: 'o2o_item'
      }
    });

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      await item.decrement('like_count');
      res.json({
        message: '取消点赞成功',
        liked: false,
        like_count: Math.max(0, (item.like_count || 0) - 1)
      });
    } else {
      // 点赞
      await Like.create({
        user_id: userId,
        target_id: id,
        target_type: 'o2o_item'
      });
      await item.increment('like_count');
      res.json({
        message: '点赞成功',
        liked: true,
        like_count: (item.like_count || 0) + 1
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
};

/**
 * 获取O2O分类列表
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await O2OCategory.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    console.error('获取O2O分类失败:', error);
    res.status(500).json({ error: '获取O2O分类失败' });
  }
};

/**
 * 获取用户的O2O物品列表
 */
exports.getUserO2OItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { user_id: userId };

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: items } = await O2OItem.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
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
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      items: items.map(item => ({
        ...item.toJSON(),
        user: buildO2OUserPayload(item.user),
        category: buildO2OCategoryPayload(item.categoryInfo),
        is_liked: false,
        like_count: item.like_count || 0
      })),
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取用户O2O物品失败:', error);
    res.status(500).json({ error: '获取用户O2O物品失败' });
  }
};

/**
 * 搜索O2O物品
 */
exports.searchO2OItems = async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      category,
      type,
      min_price,
      max_price,
      location,
      sortBy = 'relevance',
      sortOrder = 'DESC'
    } = req.query;
    const categoryId = getCategoryFilterId(req.query);

    const offset = (page - 1) * limit;
    const whereClause = { status: 'available' };

    // 搜索关键词
    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { tags: { [Op.like]: `%${q}%` } }
      ];
    }

    // 其他筛选条件
    if (categoryId) whereClause.category_id = categoryId;
    if (type) whereClause.type = type;
    if (location) whereClause.location = { [Op.like]: `%${location}%` };

    if (min_price !== undefined || max_price !== undefined) {
      whereClause.price = {};
      if (min_price !== undefined) whereClause.price[Op.gte] = parseFloat(min_price);
      if (max_price !== undefined) whereClause.price[Op.lte] = parseFloat(max_price);
    }

    // 检查过期时间
    whereClause[Op.or] = [
      { expire_date: { [Op.gt]: new Date() } },
      { expire_date: null }
    ];

    // 排序逻辑
    let order = [];
    if (sortBy === 'relevance' && q) {
      // 相关性排序（简化版本，实际可以使用全文搜索）
      order = [['created_at', 'DESC']];
    } else if (sortBy === 'price') {
      order = [['price', sortOrder]];
    } else if (sortBy === 'created_at') {
      order = [['created_at', sortOrder]];
    } else {
      order = [['is_pinned', 'DESC'], ['created_at', 'DESC']];
    }

    const { count, rows: items } = await O2OItem.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
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
          model: O2OCategory,
          as: 'categoryInfo',
          attributes: ['id', 'code', 'name', 'description', 'icon']
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      items: items.map(item => ({
        ...item.toJSON(),
        user: buildO2OUserPayload(item.user),
        category: buildO2OCategoryPayload(item.categoryInfo),
        is_liked: false,
        like_count: item.like_count || 0
      })),
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('搜索O2O物品失败:', error);
    res.status(500).json({ error: '搜索O2O物品失败' });
  }
};
