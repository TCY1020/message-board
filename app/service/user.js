module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const { ctx } = this;
      const multi = app.redis.multi();
      const page = ctx.query.page || 1;
      const limit = 10;

      // 存訊息總數
      const messageCount = await ctx.model.Message.count();
      await app.redis.setnx('messageCount', messageCount);
      await app.redis.expire('messageCount', 60);
      const totalMessageCount = Number(await app.redis.get('messageCount'));

      // 存message ID
      await app.redis.setnx('messageId', 15);

      // 存使用者
      const userLength = await app.redis.llen('user');
      if (userLength === 0) {
        const user = await ctx.model.User.findAll({ raw: true });
        user.forEach(async value => {
          await app.redis.rpush('user', JSON.stringify(value));
        });
      }

      // 使用 helper 的 Pagination
      const messagePagination = new ctx.helper.Pagination(page, limit, totalMessageCount);
      const pagination = messagePagination.getPagination();


      // 查詢特定頁數據
      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      if (!dataOnRedis) {
        await ctx.helper.pullSqlToRedis(page, limit, messagePagination.getOffset(), app, ctx.model.Message, ctx.model.User);
      }

      // 檢查同分秒問題
      let messagesFromRedis;
      await app.redis.watch(`data_page${page}`);
      multi.lrange(`data_page${page}`, 0, -1);
      const redisData = await multi.exec();
      if (redisData === null) {
        await ctx.helper.pullSqlToRedis(page, limit, messagePagination.getOffset(), app, ctx.model.Message, ctx.model.User);
        const redisData = app.redis.lrange(`data_page${page}`, 0, -1);
        messagesFromRedis = redisData.map((message, index) => ({
          index,
          message: JSON.parse(message),
        }));
      } else {
        console.log('redis有東西');
        messagesFromRedis = redisData[0][1].map((message, index) => ({
          index,
          message: JSON.parse(message),
        }));
      }

      return [ messagesFromRedis, pagination, page ];
    }

    async postMessage() {
      const { ctx } = this;
      const { comment } = ctx.request.body;
      const { user } = ctx.session;
      const multi = app.redis.multi();

      // 整理要寫入的資料格式
      const userFromRedis = await app.redis.lrange('user', user - 1, user - 1);
      const messageId = await app.redis.incr('messageId');
      const userData = JSON.parse(userFromRedis);
      const message = {
        createdAt: new Date().toISOString(),
        data: {
          id: messageId,
          userId: user,
          comment,
          User: {
            name: userData.name,
          },
        },
      };

      const dataOnRedis = await app.redis.exists('data_page1');
      if (dataOnRedis) {
        await app.redis.watch('data_page1');
        multi.lpush('data_page1', JSON.stringify(message.data));
        await multi.exec();
      }

      await app.redis.rpush('update', JSON.stringify(message));
    }

    async editMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const multi = app.redis.multi();
      const page = ctx.query.page || 1;
      const limit = 10;
      const messagePagination = new ctx.helper.Pagination(page, limit);

      let messageFromRedis;
      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      if (dataOnRedis) {
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, Number(id), Number(id));
        const redisData = await multi.exec();
        messageFromRedis = { index: id, message: JSON.parse(redisData[0][1]) };
      } else {
        await ctx.helper.pullSqlToRedis(page, limit, messagePagination.getOffset(), app, ctx.model.Message, ctx.model.User);
        const redisData = await app.redis.lrange(`data_page${page}`, Number(id), Number(id));
        messageFromRedis = { index: id, message: JSON.parse(redisData) };
      }

      return [ messageFromRedis, page ];
    }

    async putMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { comment, messageId, page } = ctx.request.body;
      const editData = { messageId, comment };
      const multi = app.redis.multi();
      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      if (dataOnRedis) {
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, Number(id), Number(id));
        const redisData = await multi.exec();
        const messageFromRedis = JSON.parse(redisData[0][1]);
        messageFromRedis.comment = comment;
        await app.redis.lset(`data_page${page}`, Number(id), JSON.stringify(messageFromRedis));
      }
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
        await app.redis.rpush('edit', JSON.stringify(editData));
      }
    }
    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { page, messageId } = ctx.request.body;
      const multi = app.redis.multi();
      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      let redisData;
      if (dataOnRedis) {
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, Number(id), Number(id));
        redisData = await multi.exec();
        await app.redis.lrem(`data_page${page}`, 0, redisData[0][1]);
      }
      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起刪
      if (dataLength > 0 && dataLength >= Number(id) + 1) {
        check = await app.redis.lrem('update', 0, redisData);
        await app.redis.decr('messageId');
      }
      if (check !== 1) {
        await app.redis.rpush('delete', messageId);
      }
    }
  };
};

