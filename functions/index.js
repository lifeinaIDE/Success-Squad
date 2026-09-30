const { initializeApp } = require('firebase-admin/app');
initializeApp();

const { createPaymentOrder } = require('./createPaymentOrder');
const { razorpayWebhook } = require('./razorpayWebhook');
const { expireOrder } = require('./expireOrder');

exports.createPaymentOrder = createPaymentOrder;
exports.razorpayWebhook = razorpayWebhook;
exports.expireOrder = expireOrder;
