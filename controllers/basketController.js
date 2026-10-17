const Basket = require("../models/Basket");
const Tour = require("../models/Tour");

exports.getBasket = async (req, res) => {
  try {
    let basket = await Basket.getFromBasket();

    // Apply filters manually
    if (!basket?.id) {
      return res.status(404).json({ message: "Your cart is empty." });
    }

    res.status(200).json(basket);
  } catch (err) {
    console.error("Error in getting basket:", err.message);
    res.status(500).json({ message: "Failed to load your cart." });
  }
};

exports.addToBasket = async (req, res) => {
  const { tourId } = req.params;
  if (!tourId) {
    return res.status(400).json({ message: "Tour ID is required." });
  }

  try {
    const tour = await Tour.getTourById(tourId);
    if (!tour) {
      return res
        .status(404)
        .json({ message: "The requested tour does not exist." });
    }

    Basket.addToBasket(tour);

    res.status(201).json({
      message: `Tour ${tour.title} has been added to your cart.`,
    });
  } catch (err) {
    console.error("Error in addToBasket:", err.message);
    res.status(500).json({ message: "Add Tour to Cart" });
  }
};
