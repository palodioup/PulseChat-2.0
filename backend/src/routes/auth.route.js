import express from 'express';
import { signup, login, logout, updateProfile } from '../controllers/auth.controller.js';
import { protectRoute } from "../middleware/auth.middleware.js";
import { updatePushSubscription } from '../controllers/auth.controller.js';
const router = express.Router();

// Middleware to ensure a 'Content-Length' header is sent for all JSON responses
// This is critical for the Axios 'onDownloadProgress' percentage bar
router.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    const body = JSON.stringify(data);
    res.set('Content-Length', Buffer.byteLength(body)); // Disable chunked encoding & provide size
    return originalJson.call(this, data);
  };
  next();
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, updateProfile);

// For the check route, ensure req.user exists before sending
router.get('/check', protectRoute, (req, res) => {
  res.status(200).json(req.user);
});
router.post("/update-push-subscription", protectRoute, updatePushSubscription);

export default router;
