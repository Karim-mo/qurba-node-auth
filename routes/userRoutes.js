import express from 'express';
import asyncHandler from 'express-async-handler';
import { body } from 'express-validator';
import { FormValidation, Auth, Database } from 'qurba-node-common';

// Grab the user schema
const User = Database.Schemas.User;

// Assign a reference to avoid using the long name every time
const validate = FormValidation.validate;

const router = express.Router();

const login = asyncHandler(async (req, res) => {
	const { mobile, username, email, password } = req.body;

	const dbQuery = email ?? username ?? mobile;

	if (!dbQuery) {
		res.status(400);
		throw new Error('Invalid Request');
	}

	const user = await User.findOne({
		$or: [{ email: dbQuery }, { username: dbQuery }, { mobile: dbQuery }],
	});

	// Use our schema custom function to compare hashes
	if (user && (await user.matchPassword(password))) {
		/*
		 * To explain the ternary and nullish coalescing operator use:
		 * To ensure we can't have someone sending requests through an app like postman and bypassing the frontend
		 * We basically try to make sure the database only takes 1 input out of the 3, incase 2 or more are provided
		 * We nullify the rest of the fields and since they are sparsed, mongo wont index them during queries on that field
		 */
		res.json({
			name: user.name,
			email: email ?? null,
			username: email?.length > 0 ? null : username ?? null,
			mobile: email?.length > 0 || username?.length > 0 ? null : mobile ?? null,
			createdAt: user.createdAt,
			id: user._id,
			token: Auth.UserAuth_JWT.signToken(user),
		});
	} else {
		// Never send a 404 on login to avoid brute forcing accounts
		res.status(400);
		throw new Error('Check your login credentials.');
	}
});

const register = asyncHandler(async (req, res) => {
	const { name, mobile, username, email, password } = req.body;

	// Check which credentials were used
	const dbQuery = email ?? username ?? mobile;

	if (!dbQuery) {
		res.status(400);
		throw new Error('Invalid Request');
	}

	const user = await User.findOne({
		$or: [{ email: dbQuery }, { username: dbQuery }, { mobile: dbQuery }],
	});

	if (user) {
		res.status(400);
		throw new Error('User already exists');
	} else {
		const user = await User.create({
			name,
			email: email ?? null,
			username: email?.length > 0 ? null : username ?? null,
			mobile: email?.length > 0 || username?.length > 0 ? null : mobile ?? null,
			password,
		});

		if (user) {
			res.json({
				name: user.name,
				email: email ?? null,
				username: email?.length > 0 ? null : username ?? null,
				mobile: email?.length > 0 || username?.length > 0 ? null : mobile ?? null,
				createdAt: user.createdAt,
				id: user._id,
				token: Auth.UserAuth_JWT.signToken(user),
			});
		} else {
			res.status(500);
			throw new Error('An unknown error occured while registering, please try again later');
		}
	}
});

router
	.route('/register')
	.post(
		asyncHandler(
			validate([
				body('mobile').isNumeric().isMobilePhone().optional(),
				body('username').isAlphanumeric().optional().isLength({ min: 6 }),
				body('email').isEmail().optional(),
				body('password').isLength({ min: 8 }).isStrongPassword(),
			])
		),
		register
	);
router
	.route('/login')
	.post(
		asyncHandler(
			validate([
				body('mobile').isMobilePhone().optional(),
				body('username').isAlphanumeric().optional(),
				body('email').isEmail().optional(),
				body('password').isLength({ min: 8 }),
			])
		),
		login
	);

export default router;
