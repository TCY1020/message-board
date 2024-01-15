const { Message, User } = require('../../models');

module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      await app.redis.setnx('messageId', 5);
      const userLength = await app.redis.llen('user');
      if (userLength === 0) {
        const user = await User.findAll({ raw: true });
        user.forEach(async value => {
          await app.redis.rpush('user', JSON.stringify(value));
        });
      }
      const dataLength = await app.redis.llen('data');
      if (dataLength === 0) {
        const messages = await Message.findAll({
          include: [{ model: User }],
          raw: true,
          nest: true,
          order: [[ 'createdAt', 'DESC' ]],
        });
        messages.forEach(async value => {
          await app.redis.rpush('data', JSON.stringify(value));
        });
        const redisData = await app.redis.lrange('data', 0, -1);
        const messagesFromRedis = redisData.map((element, index) => ({
          index,
          message: JSON.parse(element),
        }));
        console.log('往資料庫查');
        return messagesFromRedis;
      }

      const redisData = await app.redis.lrange('data', 0, -1);
      console.log('redis有東西');
      const messagesFromRedis = redisData.map((element, index) => ({
        index,
        message: JSON.parse(element),
      }));
      return messagesFromRedis;
    }

    async postMessage() {
      const { ctx } = this;
      const { comment } = ctx.request.body;
      const { user } = ctx.session;
      const userFromRedis = await app.redis.lrange('user', user - 1, user - 1);
      const messageId = await app.redis.incr('messageId');
      const userObject = JSON.parse(userFromRedis);
      const data = {
        id: messageId,
        comment,
        User: {
          id: user,
          name: userObject.name,
        },
      };
      await app.redis.lpush('data', JSON.stringify(data));
      await app.redis.lpush('update', JSON.stringify(data));
    }

    async editMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const redisData = await app.redis.lrange('data', Number(id), Number(id));
      const messageFromRedis = { index: id, message: JSON.parse(redisData) };
      return messageFromRedis;
    }
    async putMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { comment } = ctx.request.body;
      const redisData = await app.redis.lrange('data', Number(id), Number(id));
      const messageFromRedis = JSON.parse(redisData);
      messageFromRedis.comment = comment;
      await app.redis.lset('data', Number(id), JSON.stringify(messageFromRedis));
      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起改
      if (dataLength > 0 && dataLength >= Number(id) + 1) {
        const redisData = await app.redis.lrange('update', Number(id), Number(id));
        const updateData = JSON.parse(redisData);
        updateData.comment = comment;
        check = await app.redis.lset('update', Number(id), JSON.stringify(updateData));
      }
      if (check !== 'OK') {
        await app.redis.lpush('edit', JSON.stringify(messageFromRedis));
      }
    }
    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const redisData = await app.redis.lrange('data', Number(id), Number(id));
      await app.redis.lrem('data', 0, redisData);
      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起刪
      if (dataLength > 0 && dataLength >= Number(id) + 1) {
        check = await app.redis.lrem('update', 0, redisData);
        await app.redis.decr('messageId');
      }
      if (check !== 1) {
        await app.redis.lpush('delete', redisData);
      }
    }
  };
};
