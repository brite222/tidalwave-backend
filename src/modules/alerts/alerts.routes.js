const router = require('express').Router();
const ctrl = require('./alerts.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.use(requireAuth);

/**
 * @openapi
 * /alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: List threshold alerts
 *     parameters:
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Alert list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Alert' }
 */
router.get('/', requireRole('admin', 'contractor'), ctrl.list);

/**
 * @openapi
 * /alerts/{id}/resolve:
 *   patch:
 *     tags: [Alerts]
 *     summary: Mark an alert as resolved
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert resolved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Alert' }
 */
router.patch('/:id/resolve', requireRole('admin'), ctrl.resolve);

module.exports = router;