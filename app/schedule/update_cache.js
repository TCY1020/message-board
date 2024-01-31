
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
        const bulkInsertData = updateFromRedis.map(update => ({
          id: update.data.id,
          userId: update.data.userId,
          comment: update.data.comment,
          createdAt: update.createdAt,
        }));
        await ctx.model.Message.bulkCreate(bulkInsertData);
      }
    }

    const editLength = await app.redis.llen('edit');
    if (editLength > 0) {
      for (let i = 0; i < editLength; i += 50) {
        const redisData = await app.redis.lpop('edit', 50);
        const editFromRedis = redisData.map(element => JSON.parse(element));
        const updatePromises = editFromRedis.map(async edit => {
          const message = await ctx.model.Message.findByPk(edit.messageId);
          return message.update({
            comment: edit.comment,
          });
        });
        await Promise.all(updatePromises);
      }
    }

    const deleteLength = await app.redis.llen('delete');
    if (deleteLength > 0) {
      for (let i = 0; i < deleteLength; i += 50) {
        const redisData = await app.redis.lpop('delete', 50);
        const deleteIds = redisData.map(deleteItem => Number(deleteItem));
        console.log('你長得怎樣？', deleteIds);
        await ctx.model.Message.destroy({ where: { id: deleteIds } });
      }
    }
  },
};

