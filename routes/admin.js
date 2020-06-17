const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const fileHelper = require('../util/file');

const expValidator = require('express-validator');

// /admin/add-product
// get request
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product
// post request
router.post('/add-product', [
    expValidator.body('title')
        .isString()
        .withMessage('Title must have a minimum of 3 characters')
        .isLength({ min: 3 })
        .trim(),
    // expValidator.body('image')
    //     .isURL()
    //     .withMessage('Please enter a valid url'),
    expValidator.body('price')
        .isFloat()
        .withMessage('Price should be with 2 decimals atleast'),
    expValidator.body('description')
        .isLength({ min: 8, max: 200 })
        .withMessage('Description should have a minimum of 8 and maximum of 200 chars')
        .trim()
], isAuth, 
    // fileHelper.imageStorage.single('image'), 
    adminController.postAddProduct);

// /admin/products
// get request
router.get('/products', isAuth, adminController.getProducts);

// /admin/edit-product
// get request
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit-product
// post request
router.post('/edit-product', [
    expValidator.body('title')
        .isString()
        .isLength({ min: 3 })
        .withMessage('Title must have a minimum of 3 characters')
        .trim(),
    // expValidator.body('imageUrl')
    //     .isURL()
    //     .withMessage('Please enter a valid url'),
    expValidator.body('price')
        .isFloat()
        .withMessage('Price should be with 2 decimals atleast'),
    expValidator.body('description')
        .isLength({ min: 8, max: 200 })
        .withMessage('Description should have a minimum of 8 and maximum of 200 chars')
        .trim()
], isAuth, adminController.postEditProduct);

// /admin/delete-product
// post request
router.post('/delete-product', isAuth, adminController.postDeleteProduct);


module.exports = router;