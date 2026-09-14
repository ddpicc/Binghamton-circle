const { Op } = require('sequelize');
const { HomeBannerConfig, Activity, Notice } = require('../models');

async function buildBannerPayload(config) {
  if (!config) return null;

  if (config.source_type === 'activity') {
    const activity = await Activity.findByPk(config.source_id);
    if (!activity || activity.status !== 'published') return null;
    return {
      id: activity.id,
      type: 'activity',
      sourceType: 'activity',
      sourceId: activity.id,
      customTag: config.custom_tag || '',
      customTitle: config.custom_title || '',
      customLinkText: config.custom_link_text || '',
      tag: config.custom_tag || activity.category || activity.type || '校园活动',
      title: config.custom_title || activity.title || '查看最新校园活动',
      linkText: config.custom_link_text || '查看详情',
      path: `/pages/activities/detail/index?id=${activity.id}`,
      configId: config.id
    };
  }

  if (config.source_type === 'notice') {
    const notice = await Notice.findByPk(config.source_id);
    if (
      !notice ||
      !notice.is_published ||
      notice.status === 'archived' ||
      (notice.expire_time && new Date(notice.expire_time).getTime() < Date.now())
    ) {
      return null;
    }
    return {
      id: notice.id,
      type: 'notice',
      sourceType: 'notice',
      sourceId: notice.id,
      customTag: config.custom_tag || '',
      customTitle: config.custom_title || '',
      customLinkText: config.custom_link_text || '',
      tag: config.custom_tag || notice.category || '通知提醒',
      title: config.custom_title || notice.title || '查看最新通知',
      linkText: config.custom_link_text || '查看通知',
      path: `/pages/notices/detail/index?id=${notice.id}`,
      configId: config.id
    };
  }

  return null;
}

async function getActiveBannerConfig() {
  const now = new Date();
  return HomeBannerConfig.findOne({
    where: {
      is_active: true,
      [Op.and]: [
        {
          [Op.or]: [
            { start_time: null },
            { start_time: { [Op.lte]: now } }
          ]
        },
        {
          [Op.or]: [
            { end_time: null },
            { end_time: { [Op.gte]: now } }
          ]
        }
      ]
    },
    order: [['updated_at', 'DESC']]
  });
}

exports.getHomeBanner = async (req, res) => {
  try {
    const config = await getActiveBannerConfig();
    if (!config) {
      return res.json({ banner: null });
    }

    const banner = await buildBannerPayload(config);
    if (!banner) {
      return res.json({ banner: null });
    }

    res.json({ banner });
  } catch (error) {
    console.error('获取首页 Banner 失败:', error);
    res.status(500).json({ error: '获取首页 Banner 失败' });
  }
};

exports.updateHomeBanner = async (req, res) => {
  try {
    const {
      source_type,
      source_id,
      custom_tag,
      custom_title,
      custom_link_text,
      start_time,
      end_time
    } = req.body;

    if (!source_type || !source_id) {
      return res.status(400).json({ error: '请选择要展示的内容' });
    }

    if (!['activity', 'notice'].includes(source_type)) {
      return res.status(400).json({ error: '不支持的 Banner 类型' });
    }

    const sourceId = Number(source_id);
    if (!sourceId) {
      return res.status(400).json({ error: '无效的内容 ID' });
    }

    if (source_type === 'activity') {
      const activity = await Activity.findByPk(sourceId);
      if (!activity || activity.status !== 'published') {
        return res.status(404).json({ error: '活动不存在或不可展示' });
      }
    }

    if (source_type === 'notice') {
      const notice = await Notice.findByPk(sourceId);
      if (
        !notice ||
        !notice.is_published ||
        notice.status === 'archived' ||
        (notice.expire_time && new Date(notice.expire_time).getTime() < Date.now())
      ) {
        return res.status(404).json({ error: '通知不存在或不可展示' });
      }
    }

    const config = await HomeBannerConfig.sequelize.transaction(async (transaction) => {
      await HomeBannerConfig.update(
        { is_active: false, updated_by: req.user.id },
        { where: { is_active: true }, transaction }
      );

      let currentConfig = await HomeBannerConfig.findOne({
        where: {
          source_type,
          source_id: sourceId
        },
        order: [['updated_at', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const payload = {
        source_type,
        source_id: sourceId,
        custom_tag: custom_tag || null,
        custom_title: custom_title || null,
        custom_link_text: custom_link_text || null,
        start_time: start_time || null,
        end_time: end_time || null,
        is_active: true,
        updated_by: req.user.id
      };

      if (currentConfig) {
        await currentConfig.update(payload, { transaction });
      } else {
        currentConfig = await HomeBannerConfig.create({
          ...payload,
          created_by: req.user.id
        }, { transaction });
      }

      return currentConfig;
    });

    const banner = await buildBannerPayload(config);
    res.json({
      message: '首页 Banner 已更新',
      banner
    });
  } catch (error) {
    console.error('更新首页 Banner 失败:', error);
    res.status(500).json({ error: '更新首页 Banner 失败' });
  }
};
