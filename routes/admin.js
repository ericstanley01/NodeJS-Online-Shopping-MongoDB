const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

// /admin/add-product
// get request
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product
// post request
router.post('/add-product', isAuth, adminController.postAddProduct);

// /admin/products
// get request
router.get('/products', isAuth, adminController.getProducts);

// /admin/edit-product
// get request
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit-product
// post request
router.post('/edit-product', isAuth, adminController.postEditProduct);

// /admin/delete-product
// post request
router.post('/delete-product', isAuth, adminController.postDeleteProduct);


module.exports = router;