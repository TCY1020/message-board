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
      for (let i = 0; i < updateLength; i += 50) {
        const redisData = await app.redis.lpop('update', 50);
        const updateFromRedis = redisData.map(element => JSON.parse(element));
        for (const update of updateFromRedis) {
          await Message.create({
            id: update.data.id,
            userId: update.data.userId,
            comment: update.data.comment,
            createdAt: update.createdAt,
          });
        }
      }
    }

    const editLength = await app.redis.llen('edit');
    if (editLength > 0) {
      for (let i = 0; i < editLength; i += 50) {
        const redisData = await app.redis.lpop('edit', 50);
        const editFromRedis = redisData.map(element => JSON.parse(element));
        for (const edit of editFromRedis) {
          const message = await Message.findByPk(edit.id);
          await message.update({
            comment: edit.comment,
          });
        }
      }
    }

    const deleteLength = await app.redis.llen('delete');
    if (deleteLength > 0) {
      for (let i = 0; i < deleteLength; i += 50) {
        const redisData = await app.redis.lpop('delete', 50);
        const deleteFromRedis = redisData.map(element => JSON.parse(element));
        for (const dele of deleteFromRedis) {
          const message = await Message.findByPk(dele.id);
          await message.destroy();
        }
      }
    }
  },
};

