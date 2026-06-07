const router = require('express').Router();
const db = require('../../config/database');
const { success } = require('../../utils/apiResponse');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get current user's notifications
 *     parameters:
 *       - in: query
 *         name: unread_only
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Notifications
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Notification' }
 */
router.get('/', async (req, res, next) => {
  try {
    const where = req.query.unread_only === 'true' ? 'AND read=false' : '';
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id=$1 ${where} ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    success(res, { data: rows });
  } catch (e) { next(e); }
});

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Marked read }
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    await db.query(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]);
    success(res, { message: 'Marked as read' });
  } catch (e) { next(e); }
});

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200: { description: All marked read }
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    await db.query(`UPDATE notifications SET read=true WHERE user_id=$1`, [req.user.id]);
    success(res, { message: 'All marked as read' });
  } catch (e) { next(e); }
});

/**
 * @openapi
 * /notifications/device-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register FCM device token for push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, platform]
 *             properties:
 *               token: { type: string }
 *               platform: { type: string, enum: [ios, android, web] }
 *     responses:
 *       201: { description: Token registered }
 */
router.post('/device-token', async (req, res, next) => {
  try {
    await db.query(
      `INSERT INTO device_tokens (user_id, token, platform) VALUES ($1,$2,$3)`,
      [req.user.id, req.body.token, req.body.platform]
    );
    success(res, { status: 201, message: 'Device token registered' });
  } catch (e) { next(e); }
});

module.exports = router;