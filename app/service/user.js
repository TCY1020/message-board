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
      setInterval(async () => {
        const dataLength = await app.redis.llen('update');
        if (dataLength > 0) {
          const data = await app.redis.lrange('update', 0, dataLength - 1);
          const updateFromRedis = data.map((element, index) => ({
            index,
            message: JSON.parse(element),
          }));
          for (const update of updateFromRedis) {
            await Message.create({
              userId: update.message.User.id,
              comment: update.message.comment,
            });
          }
          await app.redis.del('update');
        }
      }, 1000);

    }

    async editMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const message = await Message.findByPk(id, {
        include: [{ model: User }],
        raw: true,
        nest: true,
      });
      if (!message) throw new Error('查無此留言');
      return message;
    }
    async putMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { comment } = ctx.request.body;
      const message = await Message.findByPk(id);
      if (!message) throw new Error('查無此留言');
      await message.update({
        comment,
      });
    }
    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      console.log(id);
      // const message = await Message.findByPk(id);
      // if (!message) throw new Error('查無此留言');
      // await message.destroy();
      // return id;
    }
  };
};
