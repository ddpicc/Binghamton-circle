const sequelize = require('../config/database');
const User = require('./User');
const UserProfile = require('./UserProfile');
const Post = require('./Post');
const Comment = require('./Comment');
const Notice = require('./Notice');
const Activity = require('./Activity');
const ActivityParticipant = require('./ActivityParticipant');
const O2OItem = require('./O2OItem');
const O2OCategory = require('./O2OCategory');
const Like = require('./Like');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Circle = require('./Circle');
const CircleMember = require('./CircleMember');
const CircleCategory = require('./CircleCategory');
const TreeHolePost = require('./TreeHolePost');
const TreeHoleComment = require('./TreeHoleComment');
const TreeHoleLike = require('./TreeHoleLike');
const LifeMapPoint = require('./LifeMapPoint');
const LifeMapPointSubmission = require('./LifeMapPointSubmission');
const BlockedKeyword = require('./BlockedKeyword');
const NonEduEmailRequest = require('./NonEduEmailRequest');
const EmailVerificationToken = require('./EmailVerificationToken');
const HomeBannerConfig = require('./HomeBannerConfig');
const AllowedLoginEmail = require('./AllowedLoginEmail');

// 定义模型关联
User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

User.hasMany(Notice, { foreignKey: 'user_id', as: 'notices' });
Notice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 活动关联
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Activity.hasMany(ActivityParticipant, { foreignKey: 'activity_id', as: 'participants' });
ActivityParticipant.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });
User.hasMany(ActivityParticipant, { foreignKey: 'user_id', as: 'activity_participations' });
ActivityParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(O2OItem, { foreignKey: 'user_id', as: 'o2o_items' });
O2OItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

O2OCategory.hasMany(O2OItem, { foreignKey: 'category_id', as: 'items' });
O2OItem.belongsTo(O2OCategory, { foreignKey: 'category_id', as: 'categoryInfo' });

User.hasMany(Like, { foreignKey: 'user_id', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Like.belongsTo(Post, {
  foreignKey: 'target_id',
  as: 'post',
  constraints: false
});

Like.belongsTo(O2OItem, {
  foreignKey: 'target_id',
  as: 'o2oItem',
  constraints: false
});

Like.belongsTo(Notice, {
  foreignKey: 'target_id',
  as: 'notice',
  constraints: false
});

Post.hasMany(Like, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'post'
  }
});

Comment.hasMany(Like, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'comment'
  }
});

O2OItem.hasMany(Like, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'o2o_item'
  }
});

Notice.hasMany(Like, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'notice'
  }
});

// 圈子相关关联
User.hasMany(Circle, { foreignKey: 'creator_id', as: 'created_circles' });
Circle.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

Circle.belongsTo(CircleCategory, { foreignKey: 'category_id', as: 'category' });
CircleCategory.hasMany(Circle, { foreignKey: 'category_id', as: 'circles' });

Circle.hasMany(CircleMember, { foreignKey: 'circle_id', as: 'members' });
CircleMember.belongsTo(Circle, { foreignKey: 'circle_id', as: 'circle' });

User.hasMany(CircleMember, { foreignKey: 'user_id', as: 'circle_memberships' });
CircleMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Circle.hasMany(Post, { foreignKey: 'circle_id', as: 'posts' });
Post.belongsTo(Circle, { foreignKey: 'circle_id', as: 'circle' });

// 树洞相关关联
User.hasMany(TreeHolePost, { foreignKey: 'user_id', as: 'tree_hole_posts' });
TreeHolePost.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TreeHolePost.hasMany(TreeHoleComment, { foreignKey: 'post_id', as: 'comments' });
TreeHoleComment.belongsTo(TreeHolePost, { foreignKey: 'post_id', as: 'post' });

User.hasMany(TreeHoleComment, { foreignKey: 'user_id', as: 'tree_hole_comments' });
TreeHoleComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TreeHoleComment.hasMany(TreeHoleComment, { foreignKey: 'parent_id', as: 'replies' });
TreeHoleComment.belongsTo(TreeHoleComment, { foreignKey: 'parent_id', as: 'parent' });

User.hasMany(TreeHoleLike, { foreignKey: 'user_id', as: 'tree_hole_likes' });
TreeHoleLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TreeHolePost.hasMany(TreeHoleLike, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'post'
  }
});

TreeHoleComment.hasMany(TreeHoleLike, { 
  foreignKey: 'target_id', 
  as: 'likes',
  scope: {
    target_type: 'comment'
  }
});

// 私信关联
Conversation.belongsTo(User, { foreignKey: 'user_a_id', as: 'userA' });
Conversation.belongsTo(User, { foreignKey: 'user_b_id', as: 'userB' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });

Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sent_messages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'received_messages' });

// 生活地图关联
LifeMapPoint.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
LifeMapPointSubmission.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });
LifeMapPointSubmission.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
LifeMapPointSubmission.belongsTo(LifeMapPoint, { foreignKey: 'approved_point_id', as: 'approved_point' });

// 非 edu 邮箱申请关联
NonEduEmailRequest.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
User.hasMany(NonEduEmailRequest, { foreignKey: 'admin_id', as: 'processed_non_edu_requests' });

NonEduEmailRequest.hasMany(EmailVerificationToken, { foreignKey: 'request_id', as: 'tokens' });
EmailVerificationToken.belongsTo(NonEduEmailRequest, { foreignKey: 'request_id', as: 'request' });

EmailVerificationToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(EmailVerificationToken, { foreignKey: 'user_id', as: 'email_tokens' });

User.hasMany(HomeBannerConfig, { foreignKey: 'created_by', as: 'created_home_banners' });
User.hasMany(HomeBannerConfig, { foreignKey: 'updated_by', as: 'updated_home_banners' });
HomeBannerConfig.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
HomeBannerConfig.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(AllowedLoginEmail, { foreignKey: 'created_by', as: 'created_allowed_login_emails' });
User.hasMany(AllowedLoginEmail, { foreignKey: 'updated_by', as: 'updated_allowed_login_emails' });
AllowedLoginEmail.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
AllowedLoginEmail.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// 导出所有模型
module.exports = {
  sequelize,
  User,
  UserProfile,
  Post,
  Comment,
  Notice,
  O2OItem,
  O2OCategory,
  Like,
  Circle,
  CircleMember,
  CircleCategory,
  TreeHolePost,
  TreeHoleComment,
  TreeHoleLike,
  Activity,
  LifeMapPoint,
  LifeMapPointSubmission,
  ActivityParticipant,
  Conversation,
  Message,
  BlockedKeyword,
  NonEduEmailRequest,
  EmailVerificationToken,
  HomeBannerConfig,
  AllowedLoginEmail
};
