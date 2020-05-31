const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /
// get request
router.get('/', shopController.getIndex);

// /productsfetchAll
// get request
router.get('/products', shopController.getProducts);

// /products/:id
// get request
router.get('/products/:productId', shopController.getProduct);

// /cart
// get request
router.get('/cart', isAuth, shopController.getCart);

// /cart
// post request
router.post('/cart', isAuth, shopController.postCart);

// /cart-delete-item
// post request
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

// /create-order
// post request
router.post('/create-order', isAuth, shopController.postOrder);

// /orders
// get request
router.get('/orders', isAuth, shopController.getOrders);

// /checkout
// get request
// router.get('/checkout', shopController.getCheckout);

module.exports = router;