const { Message, User } = require('../../models');

module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const user = await app.redis.lrange('user', 0, -1);
      if (user.length === 0) {
        const user = await User.findAll({ raw: true });
        user.forEach(async value => {
          await app.redis.rpush('user', JSON.stringify(value));
        });
      }
      const redisData = await app.redis.lrange('data', 0, -1);
      if (redisData.length === 0) {
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
      const userObject = JSON.parse(userFromRedis);
      const data = {
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
      console.log('修改', id);
      const redisData = await app.redis.lrange('data', Number(id), Number(id));
      const messageFromRedis = JSON.parse(redisData);
      messageFromRedis.comment = comment;
      await app.redis.lset('data', Number(id), JSON.stringify(messageFromRedis));
      const dataLength = await app.redis.llen('update');
      // 如果Ｒ未上傳DB，update一起改
      if (dataLength > 0) {
        const redisData = await app.redis.lrange('update', Number(id), Number(id));
        const updateData = JSON.parse(redisData);
        updateData.comment = comment;
        await app.redis.lset('update', Number(id), JSON.stringify(updateData));
      }
      // // await app.redis.lest('data',)
      // const message = await Message.findByPk(id);
      // if (!message) throw new Error('查無此留言');
      // await message.update({
      //   comment,
      // });
    }
    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      // const message = await Message.findByPk(id);
      // if (!message) throw new Error('查無此留言');
      // await message.destroy();
      // return id;
    }
  };
};
