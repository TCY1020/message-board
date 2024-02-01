

module.exports = app => {
  return class CommonService extends app.Service {
    async pullSqlToRedis(page, limit, offset) {
      const { ctx } = this;
      const messages = await ctx.model.Message.findAll({
        include: [{ model: ctx.model.User }],
        limit,
        offset,
        raw: true,
        nest: true,
        order: [[ 'createdAt', 'DESC' ]],
      });
      const pruneMessages = messages.map(message => ({
        id: message.id,
        userId: message.userId,
        comment: message.comment,
        user: {
          name: message.User.name,
        },
      }));
      pruneMessages.forEach(async message => { await app.redis.rpush(`data_page${page}`, JSON.stringify(message)); });
      await app.redis.expire(`data_page${page}`, 90);
      console.log('往DB查');
    }
  };
};
