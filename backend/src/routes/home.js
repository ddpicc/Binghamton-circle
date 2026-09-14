const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/banner', homeController.getHomeBanner);
router.put('/banner', authenticate, requireAdmin, homeController.updateHomeBanner);

module.exports = router;
