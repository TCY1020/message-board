const getPagination = (page = 1, limit = 10, total) => {
  const totalPage = Math.ceil(total / limit);
  const pages = Array.from({ length: totalPage }, (_, index) => index + 1);
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  return { totalPage, pages, start, end };
};
const getOffset = (limit = 10, page = 1) => (page - 1) * limit;

const pullSqlToRedis = async (page, limit, offset, app, Message, User) => {
  const messages = await Message.findAll({
    include: [{ model: User }],
    limit,
    offset,
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
  pruneMessages.forEach(async message => { await app.redis.rpush(`data_page${page}`, JSON.stringify(message)); });
  await app.redis.expire(`data_page${page}`, 90);
  console.log('往DB查');

};

module.exports = {
  getPagination,
  getOffset,
  pullSqlToRedis,
};
