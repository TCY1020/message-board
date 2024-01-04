const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User, Message } = require('./models');

module.exports = app => {
  app.passport.use(
    new LocalStrategy(
      {
        usernameField: 'account',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req, account, password, cb) => {
        try {
          const user = await User.findOne({ where: { account } });
          if (!user) {
            return cb(null, false, { message: '帳號錯誤' });
          }
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return cb(null, false, { message: '密碼錯誤' });
          }
          return cb(null, user);
        } catch (err) {
          return cb(err);
        }
      }
    )
  );

  app.passport.serializeUser(async (ctx, user) => {
    return user.id;
  });

  app.passport.deserializeUser(async (ctx, id) => {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        return null;
      }

      return user;
    } catch (err) {
      return null;
    }
  });
};
