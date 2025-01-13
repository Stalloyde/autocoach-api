const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = [
  body('username').trim().notEmpty().escape().withMessage('*Username required'),
  body('password').trim().notEmpty().escape().withMessage('*Password required'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .custom((value, { req }) => value === req.body.password)
    .escape()
    .withMessage('*Passwords do not match'),

  expressAsyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const errorResponses = {
      usernameError: null,
      passwordError: null,
      confirmPasswordError: null,
    };

    if (!errors.isEmpty()) {
      const errorsArray = errors.array();

      errorsArray.forEach((error) => {
        if (error.path === 'username') {
          errorResponses.usernameError = error.msg;
        } else if (error.path === 'password') {
          errorResponses.passwordError = error.msg;
        } else {
          errorResponses.confirmPasswordError = error.msg;
        }
      });
      return res.json(errorResponses);
    }

    let newUser = {
      username: req.body.username,
      password: req.body.password,
    };

    const { username } = newUser;
    const checkDuplicate = await prisma.user.findUnique({
      where: { username: username },
    });

    if (checkDuplicate) {
      errorResponses.usernameError = `*Username is taken.`;
      return res.json(errorResponses);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    newUser.password = hashedPassword;
    await prisma.user.create({ data: newUser });

    return res.json('Sign up successful!');
  }),
];

exports.login = [
  body('username').trim().notEmpty().escape().withMessage('*Username required'),
  body('password').trim().notEmpty().escape().withMessage('*Password required'),

  expressAsyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const errorResponses = {
      passwordError: null,
      usernameError: null,
    };

    if (!errors.isEmpty()) {
      const errorsArray = errors.array();
      errorsArray.forEach((error) => {
        if (error.path === 'username') errorResponses.usernameError = error.msg;
        if (error.path === 'password') errorResponses.passwordError = error.msg;
      });
      return res.json(errorResponses);
    }

    const user = await prisma.user.findUnique({
      where: { username: req.body.username },
      select: { id: true, username: true, password: true },
    });

    if (!user) {
      errorResponses.usernameError = '*User not found';
      return res.json(errorResponses);
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      errorResponses.passwordError = '*Incorrect password';
      return res.json(errorResponses);
    }

    jwt.sign(
      { user },
      process.env.SECRET,
      { expiresIn: '1h', algorithm: 'HS256' },
      (err, token) => {
        if (err) {
          throw Error(err);
        } else {
          const { username } = user;
          return res.json({ username, Bearer: `Bearer ${token}` });
        }
      },
    );
  }),
];

exports.addToFavourites = [
  body('workoutName')
    .trim()
    .notEmpty()
    .escape()
    .withMessage('*Workout name required'),
  body('reps').trim().notEmpty().escape(),
  body('repInterval').trim().notEmpty().escape(),
  body('waves').trim().notEmpty().escape(),
  body('waveInterval').trim().notEmpty().escape(),
  body('countdown').trim().notEmpty().escape(),

  expressAsyncHandler(async (req, res) => {
    await prisma.workout.create({
      data: {
        workoutName: req.body.workoutName,
        reps: Number(req.body.reps),
        userId: Number(req.user.user.id),
        repInterval: Number(req.body.repInterval),
        waves: Number(req.body.waves),
        waveInterval: Number(req.body.waveInterval),
        countdown: Number(req.body.countdown),
      },
    });

    return res.json('Saved!');
  }),
];
