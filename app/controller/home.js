module.exports = app => {
  return class HomeController extends app.Controller {
    async index() {
      const { ctx } = this;
      await ctx.render('login');
    }

    async login() {
      const { ctx } = this;
      await ctx.redirect('/message');
    }

    async getMessages() {
      const { ctx, service, app } = this;
      const redisData = await app.redis.lrange('data', 0, -1);
      if (redisData.length > 0) {
        console.log('redis有東西');
        const data = redisData.map(JSON.parse);
        return await ctx.render('message', { data });
      }
      const data = await service.user.getMessages();
      data.forEach(async (value, item) => {
        await app.redis.rpush('data', JSON.stringify(value));
      });
      await ctx.render('message', { data });
      console.log('往資料庫查');
    }

    async postMessage() {
      const { ctx, service } = this;
      await service.user.postMessage();
      await app.redis.del('data');
      await ctx.redirect('/message');
    }

    async editMessage() {
      const { ctx, service } = this;
      const data = await service.user.editMessage();
      await ctx.render('message_edit', { data });
    }

    async putMessage() {
      const { ctx, service, app } = this;
      await service.user.putMessage();
      await app.redis.del('data');
      await ctx.redirect('/message');
    }

    async deleteMessage() {
      const { ctx, service } = this;
      await service.user.deleteMessage();
      await app.redis.del('data');
      await ctx.redirect('/message');
    }
  };
};
