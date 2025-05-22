"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const router = express_1.default.Router();
router.post('/create', orderController_1.createOrder);
router.get('/user/:userId', orderController_1.getUserOrders);
router.get('/:orderId', orderController_1.getOrderDetails);
router.put('/:orderId/cancel', orderController_1.cancelOrder);
exports.default = router;
