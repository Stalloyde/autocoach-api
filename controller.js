const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.getCurrentUser = expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorsArray = errors.array();
    return res.json(errorsArray);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: Number(req.user.user.id) },
    select: { username: true, workouts: true },
  });

  return res.json(currentUser);
});

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
      select: { id: true, username: true, password: true, workouts: true },
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
          const { username, workouts } = user;
          return res.json({ username, workouts, Bearer: `Bearer ${token}` });
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsArray = errors.array();
      return res.json(errorsArray);
    }

    const errorResponses = {};
    //check duplicate workoutNames in currentUser
    const allUserWorkouts = await prisma.workout.findMany({
      where: { userId: req.user.user.id },
    });

    for (let x = 0; x < allUserWorkouts.length; x++) {
      if (allUserWorkouts[x].workoutName === req.body.workoutName) {
        errorResponses.workoutNameError = `${allUserWorkouts[x].workoutName}`;
        return res.json(errorResponses);
      }
    }
    //if no duplicates
    const createWorkout = prisma.workout.create({
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

    const getCurrentUser = prisma.user.findUnique({
      where: { id: Number(req.user.user.id) },
      select: { username: true, workouts: true },
    });

    const [newWorkout, currentUser] = await prisma.$transaction([
      createWorkout,
      getCurrentUser,
    ]);

    return res.json(currentUser);
  }),
];

exports.overwriteFavourites = [
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
    const updateWorkout = prisma.workout.update({
      where: {
        workoutName_userId: {
          userId: req.user.user.id,
          workoutName: req.body.workoutName,
        },
      },
      data: {
        reps: Number(req.body.reps),
        repInterval: Number(req.body.repInterval),
        waves: Number(req.body.waves),
        waveInterval: Number(req.body.waveInterval),
        countdown: Number(req.body.countdown),
      },
    });

    const getCurrentUser = prisma.user.findUnique({
      where: { id: Number(req.user.user.id) },
      select: { username: true, workouts: true },
    });

    const [updatedWorkout, currentUser] = await prisma.$transaction([
      updateWorkout,
      getCurrentUser,
    ]);
    return res.json(currentUser);
  }),
];
