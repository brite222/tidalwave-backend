const router = require('express').Router();
const ctrl = require('./analytics.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.use(requireAuth, requireRole('admin', 'contractor'));

/**
 * @openapi
 * /analytics/zone-volume:
 *   get:
 *     tags: [Analytics]
 *     summary: Aggregated waste volume per zone per day
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Zone volume rows
 */
router.get('/zone-volume', ctrl.zoneVolume);

/**
 * @openapi
 * /analytics/recycling-rate:
 *   get:
 *     tags: [Analytics]
 *     summary: 30-day recycling rate (recyclable+organic / total disposals)
 *     responses:
 *       200: { description: Recycling rate }
 */
router.get('/recycling-rate', ctrl.recyclingRate);

/**
 * @openapi
 * /analytics/contractor-performance:
 *   get:
 *     tags: [Analytics]
 *     summary: Pickups completed vs assigned, avg response time
 *     responses:
 *       200: { description: Performance rows }
 */
router.get('/contractor-performance', ctrl.contractorPerformance);

/**
 * @openapi
 * /analytics/cost-savings:
 *   get:
 *     tags: [Analytics]
 *     summary: Estimated NGN savings from route optimization
 *     responses:
 *       200: { description: Cost savings summary }
 */
router.get('/cost-savings', ctrl.costSavings);

module.exports = router;