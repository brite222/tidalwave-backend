const router = require('express').Router();
const ctrl = require('./citizen.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.use(requireAuth, requireRole('citizen'));

/**
 * @openapi
 * /citizen/nearest-bin:
 *   get:
 *     tags: [Citizen]
 *     summary: Find nearest smart bins (within radius)
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: 6.4474 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 3.4553 }
 *       - in: query
 *         name: radius_m
 *         schema: { type: integer, default: 2000 }
 *     responses:
 *       200:
 *         description: Nearby bins ordered by distance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Bin'
 *                           - type: object
 *                             properties:
 *                               distance_m: { type: number }
 */
router.get('/nearest-bin', ctrl.nearest);

/**
 * @openapi
 * /citizen/dispose:
 *   post:
 *     tags: [Citizen]
 *     summary: Log a waste disposal & earn points
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bin_id, waste_type]
 *             properties:
 *               bin_id: { type: string, format: uuid }
 *               waste_type: { type: string, enum: [recyclable, organic, general, ewaste] }
 *               photo_url: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Disposal logged
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Disposal' }
 */
router.post('/dispose', ctrl.dispose);

/**
 * @openapi
 * /citizen/report-dumping:
 *   post:
 *     tags: [Citizen]
 *     summary: Report illegal dumping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng, description]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *               description: { type: string }
 *               photo_url: { type: string }
 *               address: { type: string }
 *               severity: { type: string, enum: [low, medium, high, critical] }
 *     responses:
 *       201:
 *         description: Report submitted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Issue' }
 */
router.post('/report-dumping', ctrl.report);

/**
 * @openapi
 * /citizen/rewards/balance:
 *   get:
 *     tags: [Citizen]
 *     summary: Get current points balance
 *     responses:
 *       200:
 *         description: Balance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/CreditBalance' }
 */
router.get('/rewards/balance', ctrl.balance);

/**
 * @openapi
 * /citizen/rewards/history:
 *   get:
 *     tags: [Citizen]
 *     summary: Credit history (last 100 events)
 *     responses:
 *       200: { description: History items }
 */
router.get('/rewards/history', ctrl.history);

/**
 * @openapi
 * /citizen/rewards/claim:
 *   post:
 *     tags: [Citizen]
 *     summary: Claim a reward (deducts points atomically)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reward_id]
 *             properties:
 *               reward_id: { type: string, format: uuid }
 *     responses:
 *       201: { description: Reward claimed }
 *       400: { description: Insufficient points or invalid reward }
 */
router.post('/rewards/claim', ctrl.claim);

module.exports = router;