const Product = require('../models/product');
const expValidator = require('express-validator');
// const mongoose = require('mongoose');

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
  // const _id = new mongoose.Types.ObjectId('5ee71c86bf21b883cdf03385');
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  const errors = expValidator.validationResult(req);

  if(!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      title: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    // _id, 
    title, price, description, imageUrl, userId: req.user
  });
  product.save()
    .then(result => {
      console.log('Product created successfully');
      res.redirect('/admin/products');
    })
    .catch(err => {
      // return res.status(500).render('admin/edit-product', {
      //   title: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database operation failed. Please try again.',
      //   validationErrors: []
      // });
      // console.log(err);
      // res.redirect('/500');
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
  // Product.findById(prodId)
  Product.findOne({
    userId: req.user,
    _id: prodId
    })
    .then(product => {
      // console.log(product);
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
  const updatedImageUrl = req.body.imageUrl;
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
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDescription
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  // Product
  //   .findById(prodId)
  Product.findOne({
    userId: req.user,
    _id: prodId
    })
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      product.imageUrl = updatedImageUrl;
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
  Product.find({
    userId: req.user
  })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      // console.log(products);
      res.render('admin/products', {
        products: products,
        title: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product
  //   .findByIdAndRemove(prodId, {useFindAndModify: false})
  Product.findOneAndRemove({
    userId: req.user,
    _id: prodId
  }, {useFindAndModify: false})
    .then(() => {
      console.log('Product deleted!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}