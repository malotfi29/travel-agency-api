const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Tour = require('../models/Tour');

exports.getProfile = async (req, res) => {
	try {
		const user = await User.getUserById(req.user.id);
		if (!user) {
			return res
				.status(404)
				.json({ message: 'No user found with the provided details.' });
		}

		// Exclude sensitive fields
		const { __v, otpCode, otpExpires, ...userResData } = user;
		res.json(userResData);
	} catch (err) {
		console.error('Error in getProfile:', err.message);
		res.status(500).json({ message: 'Failed to load profile.' });
	}
};

exports.updateProfile = async (req, res) => {
	try {
		const updateData = req.body;

		// Prevent updating sensitive fields directly
		delete updateData.otpCode;
		delete updateData.otpExpires;
		delete updateData.id; // Assuming 'id' is not updatable

		const updatedUser = await User.updateUser(req.user.id, updateData);
		if (!updatedUser) {
			return res
				.status(404)
				.json({ message: 'No user found with the provided details.' });
		}

		// Exclude sensitive fields
		const { __v, otpCode, otpExpires, ...userResData } = updatedUser;
		res.json({
			message: 'Profile changes saved successfully.',
			user: userResData,
		});
	} catch (err) {
		console.error('Error in updateProfile:', err.message);
		res.status(500).json({ message: 'Failed to update profile.' });
	}
};

exports.getUserTours = async (req, res) => {
	try {
		const orders = await Order.getOrdersByUserId(req.user.id);
		if (!orders?.length) {
			return res.json([]);
		}

		// Fetch associated tours
		const tourIds = orders.map((order) => order.tourId);

		const tours = [];
		for (const id of tourIds) {
			tours.push(await Tour.getTourById(id));
		}
		Promise.all(tours);
		res.json(tours);
	} catch (err) {
		console.error('Error in getUserTours:', err.message);
		res.status(500).json({ message: 'Failed to load your tours.' });
	}
};

exports.getUserTransactions = async (req, res) => {
	try {
		const transactions = await Transaction.getTransactionsByUserId(req.user.id);
		if (!transactions.length) {
			return res.json([]);
		}

		res.json(transactions);
	} catch (err) {
		console.error('Error in getUserTransactions:', err.message);
		res.status(500).json({ message: 'Failed to load your transactions.' });
	}
};
