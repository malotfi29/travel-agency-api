const Order = require('../models/Order');
const Tour = require('../models/Tour');
const Basket = require('../models/Basket');
const Transaction = require('../models/Transaction');

exports.createOrder = async (req, res) => {
  const {  nationalCode, fullName, gender, birthDate } = req.body;

  let basket = await Basket.getFromBasket();

  // Apply filters manually
  if (!basket?.id) {
   return res.status(404).json({message:"Your cart is empty."})
  }
const tourId = basket.id

  if (!nationalCode || !fullName || !gender || !birthDate) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    // Validate tour
    const tour = await Tour.getTourById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'The requested tour was not found.' });
    }

    // Check seat availability
    if (tour.availableSeats <= 0) {
      return res.status(400).json({ message: 'This tour is fully booked.' });
    }

    // Create order
    const orderData = {
      userId: req.user.id,
      tourId,
      nationalCode,
      fullName,
      gender,
      birthDate: new Date(birthDate),
      createdAt: new Date(),
    };
    const order = await Order.createOrder(orderData);

    // Create transaction
    const transactionData = {
      userId: req.user.id,
      amount: tour.price,
      type: "Purchase", // Corrected "Perches" to "Purchase"
      createdAt: new Date(),
    };
    const transaction = await Transaction.createTransaction(transactionData);



    // Update tour seats
    const updatedTour = await Tour.updateTour(tourId, { availableSeats: tour.availableSeats - 1 });
    Basket.addToBasket({})

    res.json({ message: 'Tour booked successfully.' });
  } catch (err) {
    console.error('Error in createOrder:', err.message);
    res.status(500).json({ message: 'Failed to create the order.' });
  }
};
