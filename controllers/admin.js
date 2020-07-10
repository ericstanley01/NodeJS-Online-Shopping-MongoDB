const Product = require('../models/product');
const expValidator = require('express-validator');

const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    title: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;
  
  if(!image) {
    return res.status(422).render('admin/edit-product', {
      title: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    });
  }

  const errors = expValidator.validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      title: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = req.image.url;
  const imageAssetId = req.image.asset_id;
  const imagePublicId = req.image.public_id;

  const product = new Product({
    title, price, description, imageUrl, userId: req.user, imageAssetId, imagePublicId
  });
  product.save()
    .then(result => {
      console.log('Product created successfully');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  const prodId = req.params.productId;
  Product.findOne({
    userId: req.user,
    _id: prodId
    })
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        title: 'Edit Product',
        path: '/admin/add-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = expValidator.validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      title: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      hasError: true,
      product: {
        _id: prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findOne({
    userId: req.user,
    _id: prodId
    })
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        fileHelper.removeFromCloud(product.imagePublicId);
        const imageUrl = req.image.url;
        const imageAssetId = req.image.asset_id;
        const imagePublicId = req.image.public_id;
        
        product.imageUrl = imageUrl;
        product.imageAssetId = imageAssetId;
        product.imagePublicId = imagePublicId;
      }
      product.save().then(result => {
        console.log('Product updated!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product
    .find({
      userId: req.user
    })
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find({
        userId: req.user
      })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('admin/products', {
        products: products,
        title: 'Admin Products',
        path: '/admin/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if(!product) {
        const error = new Error('Product not found');
        error.httpStatusCode = 500;
        return next(error);
      } 
      fileHelper.removeFromCloud(product.imagePublicId);
      return Product.findOneAndRemove({
        userId: req.user,
        _id: prodId
      }, {useFindAndModify: false})
    })
    .then(() => {
      console.log('Product deleted!');
      res.status(200).json({
        message: 'Success!'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: 'Deleting product failed!'
      });
    });
}