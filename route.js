const express = require('express');
const router = express.Router();
const controller = require('./controller.js');

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/saveWorkout', controller.saveWorkout);

module.exports = router;
