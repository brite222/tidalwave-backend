const router = require('express').Router();
const ctrl = require('./routes.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.use(requireAuth);

/**
 * @openapi
 * /routes/generate:
 *   post:
 *     tags: [Routes]
 *     summary: Auto-generate optimized pickup route
 *     description: |
 *       Selects bins in the zone with status `warning`/`critical`/`overflow`,
 *       prioritizes by severity & fill level, then orders by nearest-neighbour.
 *       **Roles:** admin, contractor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GenerateRouteRequest' }
 *     responses:
 *       201:
 *         description: Route created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Route' }
 *       400: { description: No eligible bins }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/generate', requireRole('admin', 'contractor'), ctrl.generate);

/**
 * @openapi
 * /routes/me:
 *   get:
 *     tags: [Routes]
 *     summary: Get current driver's routes (with bins)
 *     description: Used by the driver mobile app for offline route download.
 *     responses:
 *       200:
 *         description: Driver routes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Route' }
 */
router.get('/me', requireRole('driver'), ctrl.myRoutes);

/**
 * @openapi
 * /routes/{id}/start:
 *   post:
 *     tags: [Routes]
 *     summary: Driver starts a pending route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Route started
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Route' }
 */
router.post('/:id/start', requireRole('driver'), ctrl.start);

/**
 * @openapi
 * /routes/{id}/pickup:
 *   post:
 *     tags: [Routes]
 *     summary: Driver confirms bin pickup
 *     description: |
 *       Logs the `picked_up_at` timestamp and resets the bin's fill level.
 *       Auto-completes the route when all bins are done.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PickupRequest' }
 *     responses:
 *       200:
 *         description: Pickup confirmed
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
 *                         remaining: { type: integer, example: 3 }
 */
router.post('/:id/pickup', requireRole('driver'), ctrl.pickup);

module.exports = router;