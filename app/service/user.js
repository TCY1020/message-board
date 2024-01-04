const Service = require('egg').Service;
const { Message, User } = require('../../models');

class UserService extends Service {
  async getUsers() {
    const users = [
      { name: 'a' },
      { name: 'b' },
      { name: 'c' },
    ];
    return users;
  }

  async getMessages() {
    const { ctx } = this;
    console.log(ctx.session.passport);
    const messages = await Message.findAll({
      include: [{ model: User }],
      raw: true,
      nest: true,
      order: [[ 'createdAt', 'DESC' ]],
    });
    return messages;
  }

  async postMessage() {
    const { ctx } = this;
    const { comment } = ctx.request.body;
    const { user } = ctx.session.passport;
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
    console.log(comment);
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
}

module.exports = UserService;
