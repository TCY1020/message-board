const { Message, User } = require('../../models');

module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const { app } = this;
      const redisData = await app.redis.lrange('data', 0, -1);
      if (redisData.length > 0) {
        console.log('redis有東西');
        const messages = redisData.map(JSON.parse);
        return messages;
      }
      const messages = await Message.findAll({
        include: [{ model: User }],
        raw: true,
        nest: true,
        order: [[ 'createdAt', 'DESC' ]],
      });
      messages.forEach(async (value, item) => {
        await app.redis.rpush('data', JSON.stringify(value));
      });
      console.log('往資料庫查');
      return messages;
    }

    async postMessage() {
      const { ctx } = this;
      const { comment } = ctx.request.body;
      const { user } = ctx.session;
      await Message.create({
        userId: user,
        comment,
      });
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
      const message = await Message.findByPk(id);
      if (!message) throw new Error('查無此留言');
      await message.destroy();
      return id;
    }
  };
};
