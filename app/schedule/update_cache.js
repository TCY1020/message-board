const { Message, User } = require('../../models');

module.exports = {
  schedule: {
    interval: '1m',
    type: 'all',
  },
  async task(ctx) {
    const { app } = ctx;
    const updateLength = await app.redis.llen('update');
    if (updateLength > 0) {
      const redisData = await app.redis.lrange('update', 0, -1);
      const updateFromRedis = redisData.map((element, index) => ({
        index,
        message: JSON.parse(element),
      }));
      for (const update of updateFromRedis) {
        await Message.create({
          userId: update.message.User.id,
          comment: update.message.comment,
        }, { raw: true });
      }
      await app.redis.del('update');
      // await app.redis.del('data');
      // const messages = await Message.findAll({
      //   include: [{ model: User }],
      //   raw: true,
      //   nest: true,
      //   order: [[ 'createdAt', 'DESC' ]],
      // });
      // messages.forEach(async value => {
      //   await app.redis.rpush('data', JSON.stringify(value));
      // });
    }

    const editLength = await app.redis.llen('edit');
    if (editLength > 0) {
      const redisData = await app.redis.lrange('edit', 0, -1);
      const editFromRedis = redisData.map(element => JSON.parse(element));
      for (const edit of editFromRedis) {
        const message = await Message.findByPk(edit.id);
        await message.update({
          comment: edit.comment,
        });
      }
      await app.redis.del('edit');
      // await app.redis.del('data');
      // const messages = await Message.findAll({
      //   include: [{ model: User }],
      //   raw: true,
      //   nest: true,
      //   order: [[ 'createdAt', 'DESC' ]],
      // });
      // messages.forEach(async value => {
      //   await app.redis.rpush('data', JSON.stringify(value));
      // });
    }
  },
};

