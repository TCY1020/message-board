module.exports = app => {
  return class BoardController extends app.Controller {
    async index() {
      const { ctx } = this;
      await ctx.render('login');
    }

    async login() {
      const { ctx } = this;
      await ctx.redirect('/message');
    }

    async getMessages() {
      const { ctx, service } = this;
      const [ data, pagination, page ] = await service.board.getMessages();
      await ctx.render('message', { data, pagination, page });
    }

    async postMessage() {
      const { ctx, service } = this;
      await service.board.postMessage();
      await ctx.redirect('/message');
    }

    async editMessage() {
      const { ctx, service } = this;
      const [ data, page ] = await service.board.editMessage();
      await ctx.render('message_edit', { data, page });
    }

    async putMessage() {
      const { ctx, service } = this;
      await service.board.putMessage();
      await ctx.redirect('/message');
    }

    async deleteMessage() {
      const { ctx, service } = this;
      await service.board.deleteMessage();
      await ctx.redirect('/message');
    }
  };
};
