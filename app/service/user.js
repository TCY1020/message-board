module.exports = app => {
  return class UserService extends app.Service {
    async getMessages() {
      const { ctx } = this;
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
        await ctx.service.utils.common.pullSqlToRedis(page, limit, messagePagination.getOffset());
      }

      // 檢查同分秒問題
      let messageFormatter;
      const multi = app.redis.multi();
      await app.redis.watch(`data_page${page}`);
      multi.lrange(`data_page${page}`, 0, -1);
      const messageOfRedis = await multi.exec();
      if (messageOfRedis === null) {
        await ctx.service.utils.common.pullSqlToRedis(page, limit, messagePagination.getOffset());
        const messageOfRedis = app.redis.lrange(`data_page${page}`, 0, -1);
        messageFormatter = new ctx.helper.MessageFormatter(messageOfRedis);
      } else {
        messageFormatter = new ctx.helper.MessageFormatter(messageOfRedis[0][1]);
      }
      const messagesFromRedis = messageFormatter.getMessages();

      return [ messagesFromRedis, pagination, page ];
    }

    async postMessage() {
      const { ctx } = this;
      const { comment } = ctx.request.body;
      const { userId } = ctx.session;

      // 整理要寫入的資料格式
      const userFromRedis = await app.redis.lrange('user', userId - 1, userId - 1);
      const messageId = await app.redis.incr('messageId');
      const user = JSON.parse(userFromRedis);
      const message = {
        createdAt: new Date().toISOString(),
        data: {
          id: messageId,
          userId,
          comment,
          user: {
            name: user.name,
          },
        },
      };

      const dataOnRedis = await app.redis.exists('data_page1');
      if (dataOnRedis) {
        const multi = app.redis.multi();
        await app.redis.watch('data_page1');
        multi.lpush('data_page1', JSON.stringify(message.data));
        await multi.exec();
      }

      await app.redis.rpush('update', JSON.stringify(message));
    }

    async editMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const idNumberType = Number(id);
      const page = ctx.query.page || 1;
      const limit = 10;
      const messagePagination = new ctx.helper.Pagination(page, limit);

      let messageFromRedis;
      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      if (dataOnRedis) {
        const multi = app.redis.multi();
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, idNumberType, idNumberType);
        const messageOfRedis = await multi.exec();
        const messageFormatter = new ctx.helper.MessageFormatter(messageOfRedis[0][1]);
        messageFromRedis = messageFormatter.getMessage(id);
      } else {
        await ctx.service.utils.common.pullSqlToRedis(page, limit, messagePagination.getOffset());
        const messageOfRedis = await app.redis.lrange(`data_page${page}`, idNumberType, idNumberType);
        const messageFormatter = new ctx.helper.MessageFormatter(messageOfRedis);
        messageFromRedis = messageFormatter.getMessage(id);
      }

      return [ messageFromRedis, page ];
    }

    async putMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { comment, messageId, page } = ctx.request.body;
      const messageEdit = { messageId, comment };
      const idNumberType = Number(id);

      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      if (dataOnRedis) {
        const multi = app.redis.multi();
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, idNumberType, idNumberType);
        const messageOfRedis = await multi.exec();
        const messageFromRedis = JSON.parse(messageOfRedis[0][1]);
        messageFromRedis.comment = comment;
        await app.redis.lset(`data_page${page}`, idNumberType, JSON.stringify(messageFromRedis));
      }

      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起改
      if (dataLength > 0 && dataLength >= idNumberType + 1) {
        const messageOfRedis = await app.redis.lrange('update', idNumberType, idNumberType);
        const messageUpdate = JSON.parse(messageOfRedis);
        messageUpdate.comment = comment;
        check = await app.redis.lset('update', idNumberType, JSON.stringify(messageUpdate));
      }
      if (check !== 'OK') {
        await app.redis.rpush('edit', JSON.stringify(messageEdit));
      }
    }

    async deleteMessage() {
      const { ctx } = this;
      const { id } = ctx.params;
      const { page, messageId } = ctx.request.body;
      const idNumberType = Number(id);

      const dataOnRedis = await app.redis.exists(`data_page${page}`);
      let messageOfRedis;
      if (dataOnRedis) {
        const multi = app.redis.multi();
        await app.redis.watch(`data_page${page}`);
        multi.lrange(`data_page${page}`, idNumberType, idNumberType);
        messageOfRedis = await multi.exec();
        await app.redis.lrem(`data_page${page}`, 0, messageOfRedis[0][1]);
      }

      const dataLength = await app.redis.llen('update');
      let check;
      // 如果Ｒ未上傳DB，update一起刪
      if (dataLength > 0 && dataLength >= idNumberType + 1) {
        check = await app.redis.lrem('update', 0, messageOfRedis);
        await app.redis.decr('messageId');
      }
      if (check !== 1) {
        await app.redis.rpush('delete', messageId);
      }
    }
  };
};

