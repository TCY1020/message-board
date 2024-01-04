const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User, Message } = require('./models');

module.exports = app => {
  // 使用本地策略
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

  // 序列化用户信息
  app.passport.serializeUser(async (ctx, user) => {
    // 存储用户ID到 session 中
    return user.id;
  });

  // 反序列化用户信息
  app.passport.deserializeUser(async (ctx, id) => {
    try {
      // 通过用户ID查找用户
      const user = await User.findByPk(id);

      if (!user) {
        return null; // 用户不存在
      }

      // 返回用户信息
      return user;
    } catch (err) {
      return null; // 反序列化失败
    }
  });
};
