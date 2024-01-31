
class Pagination {
  constructor(page, limit, total = 0) {
    this.page = page;
    this.limit = limit;
    this.total = total;
  }
  getOffset() {
    const offset = (this.page - 1) * this.limit;
    return offset;
  }
  getPagination() {
    const totalPage = Math.ceil(this.total / this.limit);
    const pages = Array.from({ length: totalPage }, (_, index) => index + 1);
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit - 1;
    return { totalPage, pages, start, end };
  }
}

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
  Pagination,
  pullSqlToRedis,
};
