const express = require('express');
const router = express.Router();
const controller = require('./controller.js');
const passport = require('passport');

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get(
  '/addToFavourites',
  passport.authenticate('jwt', { session: false }),
  controller.addToFavourites,
);

module.exports = router;
