const { Message, User } = require('../../models');

module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const { ctx } = this;
      const userId = ctx.query.userId;
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
        const dataLength = await app.redis.llen(`data_user_id${userId}`);
        if (dataLength === 0) {
          console.log('有進來');
          const messages = await Message.findAll({
            include: [{ model: User }],
            where: { userId: Number(userId) },
            raw: true,
            nest: true,
            order: [[ 'createdAt', 'DESC' ]],
          });
          // 將 Redis 裡的 data 拿出來
          const totalMessages = await app.redis.lrange('data', 0, -1);
          const newTotalMessages = totalMessages.map((element, index) => ({
            index,
            message: JSON.parse(element),
          }));
          const dbMessageId = messages.map(element => element.id);
          // 篩選出我要的 Redis 裡的 data
          const filterMessage = newTotalMessages.filter(element => dbMessageId.includes(element.message.id));
          filterMessage.forEach(async message => {
            await app.redis.rpush(`data_user_id${userId}`, JSON.stringify(message));
          });
          await app.redis.expire(`data_user_id${userId}`, 60);
        }
        const redisData = await app.redis.lrange(`data_user_id${userId}`, 0, -1);
        console.log('redis有東西');
        const messagesFromRedis = redisData.map(element => (JSON.parse(element)));
        return messagesFromRedis;
      }

      // 查詢全部
      const dataLength = await app.redis.llen('data');
      if (dataLength === 0) {
        const messages = await Message.findAll({
          include: [{ model: User }],
          raw: true,
          nest: true,
          order: [[ 'createdAt', 'DESC' ]],
        });
        const batchSize = 100; // 每批次寫入的留言數量
        let batchIndex = 0;

        const sTime = Date.now();
        while (batchIndex * batchSize < messages.length) {
          const batchMessages = messages.slice(
            batchIndex * batchSize,
            (batchIndex + 1) * batchSize
          );

          // 寫入 Redis
          await Promise.all(
            batchMessages.map(async message => {
              await app.redis.rpush('data', JSON.stringify(message));
            })
          );
          batchIndex++;
        }
        const eTime = Date.now();
        console.log('寫入時間：', eTime - sTime, 'ms');
        console.log('往DB查');
      }

      const redisData = await app.redis.lrange('data', 0, -1);
      console.log('redis有東西');
      const messagesFromRedis = redisData.map((element, index) => ({
        index,
        message: JSON.parse(element),
      }));
      console.log(messagesFromRedis);
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
        userId: user,
        comment,
        User: {
          id: user,
          name: userObject.name,
        },
      };
      await app.redis.del(`data_user_id${user}`);
      await app.redis.lpush('data', JSON.stringify(data));
      await app.redis.rpush('update', JSON.stringify(data));
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
