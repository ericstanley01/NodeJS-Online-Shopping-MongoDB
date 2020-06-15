const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const expValidator = require('express-validator');

const User = require('../models/user');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_user: process.env.SENDGRID_API_KEY
    }
}));

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1].trim();
    let message = req.flash('error');

    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', {
        title: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');

    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        title: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput: { 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
        },
        validationErrors: []
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = expValidator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            title: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if(!user) {
                return res.status(422).render('auth/login', {
                    title: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid email or password',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if(doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    // req.flash('error', 'Invalid email or password');
                    return res.status(422).render('auth/login', {
                        title: 'Login',
                        path: '/login',
                        errorMessage: 'Invalid email or password',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                })
                .catch(err => {
                    console.log(err);
                    // req.flash('error', 'Error occurred while logging in');
                    // res.redirect('/login');
                    res.status(422).render('auth/login', {
                        title: 'Login',
                        path: '/login',
                        errorMessage: 'Error occurred while logging in',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                });
        })
        .catch(err => console.log(err));
}

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    const errors = expValidator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            title: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { 
                name: name, 
                email: email, 
                password: password, 
                confirmPassword: confirmPassword 
            },
            validationErrors: errors.array()
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
        return user.save();
        })
        .then(result => {
        res.redirect('/login');
        return transporter.sendMail({
            to: email,
            from: process.env.FROM_EMAIL,
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
        });
        })
        .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');

    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/reset', {
        title: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User
            .findOne({ email: req.body.email })
            .then(user => {
                if(!user) {
                    req.flash('error', 'No account with that email found');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                return transporter.sendMail({
                    to: req.body.email,
                    from: process.env.FROM_EMAIL,
                    subject: 'Password Reset',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="${process.env.SERVER_HOST}/reset/${token}" target="_blank">link</a> to set a new password</p>
                    `
                });
            })
            .catch(err => console.log(err));
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User
        .findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            if(user) {
                let message = req.flash('error');
                if(message.length > 0) {
                    message = message[0];
                } else {
                    message = null;
                }
                res.render('auth/new-password', {
                    title: 'New Password',
                    path: '/new-password',
                    errorMessage: message,
                    userId: user._id.toString(),
                    passwordToken: token
                });
            } else {
                res.redirect('/404');
            }   
        })
        .catch(err => console.log(err));   
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;

    let resetUser;
    User
        .findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                to: resetUser.email,
                from: process.env.FROM_EMAIL,
                subject: 'Password reset successful!',
                html: '<h1>You successfully have resetted your password!</h1>'
            });
        })
        .catch(err => console.log(err));

}