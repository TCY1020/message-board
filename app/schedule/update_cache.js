const { Message, User } = require('../../models');

module.exports = {
  schedule: {
    interval: '1m',
    type: 'all',
  },
  async task(ctx) {
    const { app } = ctx;
    const dataLength = await app.redis.llen('update');
    if (dataLength > 0) {
      const redisData = await app.redis.lrange('update', 0, -1);
      const updateFromRedis = redisData.map((element, index) => ({
        index,
        message: JSON.parse(element),
      }));
      for (const update of updateFromRedis) {
        const sqlData = await Message.create({
          userId: update.message.User.id,
          comment: update.message.comment,
        }, { raw: true });
        const data = {
          id: sqlData.dataValues.id,
          ...update.message,
        };
        await app.redis.lpush('postData', JSON.stringify(data));
      }
      await app.redis.del('update');
    }
  },
};

