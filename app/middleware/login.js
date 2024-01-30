
const bcrypt = require('bcryptjs');

module.exports = options => {
  return async function login(ctx, next) {
    try {
      const { account, password } = ctx.request.body;
      const user = await ctx.model.User.findOne({ where: { account }});
      console.log('問題', user);
      if (!user) { throw new Error('帳號錯誤'); }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) { throw new Error('密碼錯誤'); }
      const { id } = user;
      ctx.session.user = id;
      await next();
    } catch (err) {
      ctx.throw(400, err.message);
    }
  };
};

