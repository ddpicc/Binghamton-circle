const { Circle, CircleMember } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * 检查用户是否是圈子的成员
 * @param {number} circleId - 圈子ID
 * @param {number} userId - 用户ID
 * @param {string[]} [roles] - 要求的角色数组
 * @returns {Promise<boolean>}
 */
const isCircleMember = async (circleId, userId, roles = null) => {
  const numericCircleId = parseInt(circleId, 10);
  const where = {
    circle_id: numericCircleId,
    user_id: userId,
    status: 'approved'
  };

  if (roles) {
    where.role = roles;
  }

  const membership = await CircleMember.findOne({ where });
  return !!membership;
};

/**
 * 检查用户是否是圈子的管理员或创建者
 * @param {number} circleId - 圈子ID
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>}
 */
const isCircleAdmin = async (circleId, userId) => {
  return await isCircleMember(circleId, userId, ['creator', 'admin']);
};

/**
 * 检查用户是否是圈子的创建者
 * @param {number} circleId - 圈子ID
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>}
 */
const isCircleCreator = async (circleId, userId) => {
  return await isCircleMember(circleId, userId, ['creator']);
};

/**
 * 检查用户是否可以创建圈子
 * @param {Object} user - 用户对象
 * @returns {Promise<boolean>}
 */
const canCreateCircle = async (user) => {
  // 管理员可以创建无限圈子
  if (user.role === 'admin') {
    return true;
  }
  
  // 检查用户是否已经创建了一个圈子
  const existingCircle = await Circle.findOne({
    where: { creator_id: user.id }
  });
  
  return !existingCircle;
};

/**
 * 检查圈子是否存在
 * @param {number} circleId - 圈子ID
 * @returns {Promise<boolean>}
 */
const circleExists = async (circleId) => {
  const numericId = parseInt(circleId, 10);
  const circle = await Circle.findByPk(numericId);
  return !!circle;
};

/**
 * 中间件：检查圈子是否存在
 */
const checkCircleExists = async (req, res, next) => {
  try {
    const { circleId } = req.params;

    const exists = await circleExists(circleId);

    if (!exists) {
      throw new ApiError(404, '圈子不存在');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：检查用户是否是圈子成员
 */
const requireCircleMember = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;

    const isMember = await isCircleMember(circleId, userId);

    if (!isMember) {
      throw new ApiError(403, '您不是该圈子的成员');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：检查用户是否是圈子管理员
 */
const requireCircleAdmin = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;
    
    if (!await isCircleAdmin(circleId, userId)) {
      throw new ApiError(403, '您没有管理员权限');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：检查用户是否是圈子创建者
 */
const requireCircleCreator = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;
    
    if (!await isCircleCreator(circleId, userId)) {
      throw new ApiError(403, '只有圈子创建者可以执行此操作');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：检查用户是否可以创建圈子
 */
const checkCanCreateCircle = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!await canCreateCircle(user)) {
      throw new ApiError(403, '您已经创建了一个圈子，无法创建更多');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：检查帖子是否属于圈子
 */
const checkPostInCircle = async (req, res, next) => {
  try {
    const { circleId, postId } = req.params;
    
    // 这里需要导入Post模型
    const { Post } = require('../models');
    const post = await Post.findOne({
      where: {
        id: postId,
        circle_id: circleId
      }
    });
    
    if (!post) {
      throw new ApiError(404, '帖子不存在或不属于该圈子');
    }
    
    req.post = post;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：获取圈子信息并附加到请求对象
 */
const loadCircle = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    
    const circle = await Circle.findByPk(circleId, {
      include: ['category', 'creator']
    });
    
    if (!circle) {
      throw new ApiError(404, '圈子不存在');
    }
    
    req.circle = circle;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 中间件：获取用户在圈子中的成员信息
 */
const loadCircleMembership = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;
    
    const membership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: userId
      }
    });
    
    req.circleMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isCircleMember,
  isCircleAdmin,
  isCircleCreator,
  canCreateCircle,
  circleExists,
  checkCircleExists,
  requireCircleMember,
  requireCircleAdmin,
  requireCircleCreator,
  checkCanCreateCircle,
  checkPostInCircle,
  loadCircle,
  loadCircleMembership
};
