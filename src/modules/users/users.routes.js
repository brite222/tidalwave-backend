const router = require('express').Router();
const ctrl = require('./users.controller');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const s = require('./users.schema');

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's own profile
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   patch:
 *     tags: [Users]
 *     summary: Update the authenticated user's own profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfileRequest' }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, validate(s.updateProfileSchema), ctrl.updateMe);

module.exports = router;
