const express = require('express');
const router = express.Router();
const controller = require('./controller.js');
const passport = require('passport');

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  controller.getCurrentUser,
);
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post(
  '/addToFavourites',
  passport.authenticate('jwt', { session: false }),
  controller.addToFavourites,
);
router.put(
  '/overwriteFavourites',
  passport.authenticate('jwt', { session: false }),
  controller.overwriteFavourites,
);

module.exports = router;
