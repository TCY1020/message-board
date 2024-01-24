const { Message, User } = require('../../models');

module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const { ctx } = this;
      const userId = ctx.query.userId || '';
      const page = ctx.query.page || 1;
      // 存message ID
      await app.redis.setnx('messageId', 15);
      // 存使用者
      const userLength = await app.redis.llen('user');
      if (userLength === 0) {
        const user = await User.findAll({ raw: true });
        user.forEach(async value => {
          await app.redis.rpush('user', JSON.stringify(value));
        });
      }
      // 特殊查詢
      if (userId) {
        const dataOnRedis = await app.redis.exists(`data_user_id${userId}`);
        if (!dataOnRedis) {
          const messages = await Message.findAll({
            include: [{ model: User }],
            where: { userId: Number(userId) },
            raw: true,
            nest: true,
            order: [[ 'createdAt', 'DESC' ]],
          });
          const totalMessages = await app.redis.lrange('data', 0, -1);
          const newTotalMessages = totalMessages.map((message, index) => ({
            index: index + (page - 1) * 10,
            message: JSON.parse(message),
          }));
          const dbMessageId = messages.map(element => element.id);
          // 篩選出我要的 Redis 裡的 data
          const filterMessage = newTotalMessages.filter(element => dbMessageId.includes(element.message.id));
          filterMessage.forEach(async data => {
            await app.redis.rpush(`data_user_id${userId}`, JSON.stringify(data));
          });
          await app.redis.expire(`data_user_id${userId}`, 60);
          console.log('往DB查');
        }
        // 分頁器
        const total = await app.redis.llen(`data_user_id${userId}`);
        const pagination = ctx.helper.getPagination(page, 10, total);
        const redisData = await app.redis.lrange(`data_user_id${userId}`, pagination.start, pagination.end);
        console.log('redis有東西');
        const messagesFromRedis = redisData.map(element => (JSON.parse(element)));
        return [ messagesFromRedis, pagination, userId ];
      }

      // 查詢全部
      const dataOnRedis = await app.redis.exists('data');
      if (!dataOnRedis) {
        const messages = await Message.findAll({
          include: [{ model: User }],
          raw: true,
          nest: true,
          order: [[ 'createdAt', 'DESC' ]],
        });
        const pruneMessages = messages.map(message => ({
          id: message.id,
          userId: message.userId,
          comment: message.comment,
          User: {
            name: message.User.name,
          },
        }));
        const batchSize = 100; // 每批次寫入的留言數量
        let batchIndex = 0;

        while (batchIndex * batchSize < pruneMessages.length) {
          const batchMessages = pruneMessages.slice(
            batchIndex * batchSize,
            (batchIndex + 1) * batchSize
          );

          await Promise.all(
            batchMessages.map(async message => {
              await app.redis.rpush('data', JSON.stringify(message));
            })
          );
          batchIndex++;
        }
        console.log('往DB查');
      }

      // 分頁器
      const total = await app.redis.llen('data');
      const pagination = ctx.helper.getPagination(page, 10, total);
      const redisData = await app.redis.lrange('data', pagination.start, pagination.end);
      console.log('redis有東西');
      const messagesFromRedis = redisData.map((message, index) => ({
        index: index + (page - 1) * 10,
        message: JSON.parse(message),
      }));
      console.log('資料', messagesFromRedis);
      // const messagesFromRedis = [];
      // await ctx.helper.organizer(messagesFromRedis, redisData);
      return [ messagesFromRedis, pagination ];
    }

    async postMessage() {
      const { ctx } = this;
      const { comment } = ctx.request.body;
      const { user } = ctx.session;
      const userFromRedis = await app.redis.lrange('user', user - 1, user - 1);
      const messageId = await app.redis.incr('messageId');
      const userObject = JSON.parse(userFromRedis);
      const message = {
        createdAt: new Date().toISOString(),
        data: {
          id: messageId,
          userId: user,
          comment,
          User: {
            name: userObject.name,
          },
        },
      };
      await app.redis.del(`zData_user_id${user}`);
      await app.redis.lpush('data', JSON.stringify(message.data));
      await app.redis.rpush('update', JSON.stringify(message));
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
      // 刪除 Redis 裡有關的客製化資料
      await app.redis.del(`data_user_id${messageFromRedis.User.id}`);
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
        await app.redis.rpush('edit', JSON.stringify(messageFromRedis));
      }
    }
    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const redisData = await app.redis.lrange('data', Number(id), Number(id));
      const messageFromRedis = JSON.parse(redisData);
      // 刪除 Redis 裡有關的客製化資料
      await app.redis.del(`data_user_id${messageFromRedis.User.id}`);
      await app.redis.lrem('data', 0, redisData);
      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起刪
      if (dataLength > 0 && dataLength >= Number(id) + 1) {
        check = await app.redis.lrem('update', 0, redisData);
        await app.redis.decr('messageId');
      }
      if (check !== 1) {
        await app.redis.rpush('delete', redisData);
      }
    }
  };
};
