require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET;

const auth = async (jwtPayload, done) => {
  console.log('Auth middleware is running');
  try {
    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.user.id },
    });
    if (!user) {
      return done(null, false);
    }
    return done(null, jwtPayload);
  } catch (err) {
    return done(err, false);
  }
};

const strategy = new JwtStrategy(opts, auth);

passport.use(strategy);
