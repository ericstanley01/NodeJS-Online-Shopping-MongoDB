const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/products', {
        products: products,
        title: 'All Products',
        path: '/products'
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
  Product.find()
    .then(products => {
      res.render('shop/index', {
        products: products,
        title: 'Shop',
        path: '/'
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
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  // let fetchedCart;
  // let newQuantity = 1;
  
  // req.user
  //   .getCart()
  //   .then(cart => {
  //     fetchedCart = cart;
  //     return cart.getProducts({
  //       where: {
  //         id: productId
  //       }
  //     });
  //   })
  //   .then(products => {
  //     let product;
  //     if (products.length > 0) {
  //       product = products[0];
  //     }
  //     if (product) {
  //       // ... increase quantity by 1
  //       const oldQuantity = product.cartItem.quantity;
  //       newQuantity = oldQuantity + 1;
  //       return product;
  //     }
  //     return Product.findByPk(productId)
  //   })
  //   .then(product => {
  //     return fetchedCart.addProduct(product, {
  //       through: {
  //         quantity: newQuantity
  //       }
  //     });
  //   })
  //   .then(() => {
  //     res.redirect('/cart');
  //   })
  //   .catch(err => console.log(err));
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

exports.postOrder = (req, res, next) => {
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      console.log(user.cart.items);
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

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    title: 'Checkout',
    path: '/checkout'
  })
}

