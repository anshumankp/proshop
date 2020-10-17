const express = require('express');
const {
  authUser,
  registerUser,
  getUserProfile,
  getUsers,
  getUserById,
  updateUserProfile,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { admin, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .post(registerUser)
  .get(protect, admin, getUsers);
router.post('/login', authUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
