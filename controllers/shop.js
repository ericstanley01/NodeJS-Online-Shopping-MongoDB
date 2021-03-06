const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const dotenv = require('dotenv');

dotenv.config();

const Product = require('../models/product');
const Order = require('../models/order');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeAuthHeader = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
}

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product
    .find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/products', {
        products: products,
        title: 'All Products',
        path: '/products',
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

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        title: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product
    .find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        products: products,
        title: 'Shop',
        path: '/',
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

exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        title: 'Your cart',
        path: '/cart',
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then(product => req.user.addToCart(product))
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getCheckout = (req, res, next) => {
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let totalPrice = 0;
      
      products.forEach(p => {
        totalPrice += p.quantity * p.productId.price;
      });
      res.render('shop/checkout', {
        title: 'Checkout',
        path: '/cart',
        products: products,
        totalPrice: totalPrice.toFixed(2)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postOrder = (req, res, next) => {
  let totalPrice = 0;
  req.headers = stripeAuthHeader;
  
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {

      user.cart.items.forEach(p => {
        totalPrice += p.quantity * p.productId.price
      });

      const products = user.cart.items.map(i => {
        return {product: { ...i.productId._doc }, quantity: i.quantity}
      });
      
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user
        },
        products: products
      });
      return order.save()
    })
    .then(result => {
      return stripe.charges.create({
        source: req.body.stripeToken,
        amount: totalPrice * 100,
        currency: 'usd',
        description: 'Order details',
        metadata: { userId: req.user._id.toString(), orderId: result._id.toString() }
      });
    })
    .then(stripeResult => {
      return req.user.clearCart();
    })
    .then(result => res.redirect('/orders'))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getOrders = (req, res, next) => {
  Order
    .find({'user.userId': req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        title: 'Your orders',
        path: '/orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if(!order) {
        const error = new Error('No order found');
        return next(error);
      }
      if(order.user.userId.toString() !== req.user._id.toString()) {
        const error = new Error('Unauthorized');
        return next(error);
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const invoicePDF = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

      invoicePDF.pipe(res);

      invoicePDF.fontSize(26).text('Invoice', {
        underline: true
      });

      invoicePDF.fontSize(14).text('-----------------------------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        invoicePDF.text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
      });
      invoicePDF.text('-----------------------------------------');
      invoicePDF.fontSize(20).text('Total price: $' + totalPrice.toFixed(2));

      invoicePDF.end();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}