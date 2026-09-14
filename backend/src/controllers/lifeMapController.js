const { Op, Sequelize } = require('sequelize');
const { LifeMapPoint, LifeMapPointSubmission, User } = require('../models');

// 列出已发布点位，支持分类、bbox和半径检索
exports.listPoints = async (req, res) => {
  try {
    const { category, bbox, lat, lng, radius_km } = req.query;
    const where = { status: 'active' };
    if (category) where.category = category;

    // bbox: minLat,minLng,maxLat,maxLng
    if (bbox) {
      const [minLat, minLng, maxLat, maxLng] = bbox.split(',').map(Number);
      if ([minLat, minLng, maxLat, maxLng].some(v => Number.isNaN(v))) {
        return res.status(400).json({ error: 'Invalid bbox' });
      }
      where.latitude = { [Op.between]: [minLat, maxLat] };
      where.longitude = { [Op.between]: [minLng, maxLng] };
    }

    let order = [['updated_at', 'DESC']];
    let attributes = undefined;

    // 半径检索：返回距离排序
    if (lat && lng && radius_km) {
      const latNum = Number(lat), lngNum = Number(lng), r = Number(radius_km);
      if ([latNum, lngNum, r].some(v => Number.isNaN(v))) {
        return res.status(400).json({ error: 'Invalid lat/lng/radius_km' });
      }
      attributes = {
        include: [
          [
            Sequelize.literal(`
              6371 * acos(
                cos(radians(${latNum})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lngNum})) +
                sin(radians(${latNum})) * sin(radians(latitude))
              )
            `),
            'distance_km'
          ]
        ]
      };
      order = [[Sequelize.literal('distance_km'), 'ASC']];
      // 过滤距离
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(Sequelize.where(
        Sequelize.literal(`
          6371 * acos(
            cos(radians(${latNum})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lngNum})) +
            sin(radians(${latNum})) * sin(radians(latitude))
          )
        `),
        { [Op.lte]: r }
      ));
    }

    const points = await LifeMapPoint.findAll({ where, order, attributes, limit: 500 });
    res.json(points);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list points' });
  }
};

// 管理员直接创建正式点位
exports.createPoint = async (req, res) => {
  try {
    const data = req.body || {};
    const point = await LifeMapPoint.create({
      name: data.name,
      description: data.description,
      category: data.category || 'other',
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      phone: data.phone,
      website: data.website,
      business_hours: data.business_hours,
      tags: data.tags,
      status: data.status || 'active',
      created_by: req.user.id
    });
    res.json(point);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create point' });
  }
};

// 用户提交点位（待审核）
exports.submitPoint = async (req, res) => {
  try {
    const data = req.body || {};
    const submission = await LifeMapPointSubmission.create({
      name: data.name,
      description: data.description,
      category: data.category || 'other',
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      phone: data.phone,
      website: data.website,
      business_hours: data.business_hours,
      tags: data.tags,
      submitted_by: req.user.id,
      status: 'pending'
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit point' });
  }
};

// 列出提交（管理员或本人查看）
exports.listSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    // 非管理员仅能查看自己提交
    if (!req.user || req.user.role !== 'admin') {
      where.submitted_by = req.user?.id || 0;
    }

    const submissions = await LifeMapPointSubmission.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'username', 'primary_email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'] },
        { model: require('../models').LifeMapPoint, as: 'approved_point' }
      ]
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
};

// 审核通过：创建正式点位并更新提交
exports.approveSubmission = async (req, res) => {
  const t = await LifeMapPoint.sequelize.transaction();
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    const submission = await LifeMapPointSubmission.findByPk(id, { transaction: t });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

    const point = await LifeMapPoint.create({
      name: submission.name,
      description: submission.description,
      category: submission.category,
      latitude: submission.latitude,
      longitude: submission.longitude,
      address: submission.address,
      phone: submission.phone,
      website: submission.website,
      business_hours: submission.business_hours,
      tags: submission.tags,
      status: 'active',
      created_by: req.user.id
    }, { transaction: t });

    submission.status = 'approved';
    submission.reviewed_by = req.user.id;
    submission.reviewed_at = new Date();
    submission.review_note = note || null;
    submission.approved_point_id = point.id;
    await submission.save({ transaction: t });

    await t.commit();
    res.json({ submission, point });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
};

// 审核拒绝
exports.rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    const submission = await LifeMapPointSubmission.findByPk(id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

    submission.status = 'rejected';
    submission.reviewed_by = req.user.id;
    submission.reviewed_at = new Date();
    submission.review_note = note || null;
    await submission.save();

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
};

