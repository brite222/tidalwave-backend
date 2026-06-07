const router = require('express').Router();
const ctrl = require('./bins.controller');
const validate = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const s = require('./bins.schema');

/**
 * @openapi
 * /bins/telemetry:
 *   post:
 *     tags: [Bins]
 *     summary: IoT device pushes fill-level update
 *     description: |
 *       Called by smart bin sensors. Auto-computes status:
 *       - 0–60% → normal
 *       - 61–85% → warning
 *       - 86–99% → critical
 *       - 100% → overflow
 *       
 *       Emits `bin:update` over WebSocket to the `dashboard` room.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TelemetryRequest' }
 *     responses:
 *       200:
 *         description: Telemetry stored
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         bin_id: { type: string, format: uuid }
 *                         fill_level: { type: integer }
 *                         status: { type: string }
 *       404: { description: Bin not registered }
 */
router.post('/telemetry', validate(s.telemetrySchema), ctrl.telemetry);

/**
 * @openapi
 * /bins:
 *   get:
 *     tags: [Bins]
 *     summary: List all bins (paginated)
 *     parameters:
 *       - in: query
 *         name: zone
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [normal, warning, critical, overflow] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Bin list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Bin' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Bins]
 *     summary: Create a new smart bin (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateBinRequest' }
 *     responses:
 *       201:
 *         description: Bin created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Bin' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.use(requireAuth);
router.get('/', ctrl.list);

/**
 * @openapi
 * /bins/{id}:
 *   get:
 *     tags: [Bins]
 *     summary: Get bin details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bin details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Bin' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', ctrl.get);
router.post('/', requireRole('admin'), validate(s.createBinSchema), ctrl.create);

module.exports = router;