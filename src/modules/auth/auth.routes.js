const router = require('express').Router();
const ctrl = require('./auth.controller');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const s = require('./auth.schema');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create an account for admin, contractor, driver, or citizen.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role, first_name, last_name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ibrahim@lawma.gov.ng
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: StrongP@ss123
 *               role:
 *                 type: string
 *                 enum: [admin, contractor, driver, citizen]
 *                 example: driver
 *               first_name:
 *                 type: string
 *                 example: Ibrahim
 *               last_name:
 *                 type: string
 *                 example: Adeyemi
 *               phone:
 *                 type: string
 *                 example: "+234 803 123 4567"
 *               address:
 *                 type: string
 *                 example: 15 Admiralty Way, Lekki Phase 1
 *               agency:
 *                 type: string
 *                 example: Lagos State Waste Management Authority (LAWMA)
 *               vehicle_number:
 *                 type: string
 *                 example: TW-001
 *               drivers_license:
 *                 type: string
 *                 example: LAG-DL-2024-5678
 *               assigned_area:
 *                 type: string
 *                 example: Victoria Island
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation failed
 */
router.post('/register', validate(s.registerSchema), ctrl.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@lawma.gov.ng
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful — returns access & refresh tokens
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(s.loginSchema), ctrl.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens issued
 *       401:
 *         description: Invalid or revoked refresh token
 */
router.post('/refresh', validate(s.refreshSchema), ctrl.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke all refresh tokens for the current user
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', requireAuth, ctrl.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 */
router.post('/forgot-password', validate(s.forgotSchema), ctrl.forgot);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate(s.resetSchema), ctrl.reset);

module.exports = router;