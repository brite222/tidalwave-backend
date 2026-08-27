const router = require('express').Router();
const ctrl = require('./citizen.controller');
const validate = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const s = require('./citizen.schema');

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

/**
 * @openapi
 * /citizen/bins/verify:
 *   post:
 *     tags: [Citizen]
 *     summary: Verify a Smart Bin ID before linking
 *     description: |
 *       Onboarding step after registration ("Link Your Smart Bin"). Checks that the
 *       entered bin code exists in the registry. Does not create a link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LinkBinRequest' }
 *     responses:
 *       200:
 *         description: Smart bin found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/BinVerification' }
 *       404: { description: No smart bin matches that ID }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/bins/verify', validate(s.verifyBinSchema), ctrl.verifyBin);

/**
 * @openapi
 * /citizen/bins/link:
 *   post:
 *     tags: [Citizen]
 *     summary: Link a Smart Bin to the citizen's account
 *     description: |
 *       Completes onboarding. Creates the citizen↔bin link, awards a one-time
 *       welcome bonus on the first linked bin, and emits `bin:linked` over
 *       WebSocket to `user:<id>`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LinkBinRequest' }
 *     responses:
 *       201:
 *         description: Bin linked
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/BinLinkResult' }
 *       404: { description: No smart bin matches that ID }
 *       409: { description: Bin already linked to this account }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/bins/link', validate(s.linkBinSchema), ctrl.linkBin);

/**
 * @openapi
 * /citizen/bins:
 *   get:
 *     tags: [Citizen]
 *     summary: List Smart Bins linked to the citizen
 *     responses:
 *       200:
 *         description: Linked bins
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/LinkedBin' }
 */
router.get('/bins', ctrl.myBins);

/**
 * @openapi
 * /citizen/bins/{linkId}:
 *   delete:
 *     tags: [Citizen]
 *     summary: Unlink a Smart Bin from the citizen's account
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Bin unlinked }
 *       404: { description: Bin link not found }
 */
router.delete('/bins/:linkId', ctrl.unlinkBin);

module.exports = router;