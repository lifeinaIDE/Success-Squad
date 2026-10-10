/**
 * functions/index.js
 *
 * Firebase Cloud Functions entry point.
 * Razorpay integration has been fully removed. This file now only exports
 * the expireOrder scheduled function which cleans up stale pending_payments rows.
 */
const { initializeApp } = require('firebase-admin/app');
initializeApp();

const { expireOrder } = require('./expireOrder');
exports.expireOrder = expireOrder;
