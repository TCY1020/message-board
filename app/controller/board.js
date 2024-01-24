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
      const [ data, pagination ] = await service.user.getMessages();
      await ctx.render('message', { data, pagination });
    }

    async postMessage() {
      const { ctx, service } = this;
      await service.user.postMessage();
      await ctx.redirect('/message');
    }

    async editMessage() {
      const { ctx, service } = this;
      const data = await service.user.editMessage();
      await ctx.render('message_edit', { data });
    }

    async putMessage() {
      const { ctx, service } = this;
      await service.user.putMessage();
      await ctx.redirect('/message');
    }

    async deleteMessage() {
      const { ctx, service } = this;
      await service.user.deleteMessage();
      await ctx.redirect('/message');
    }
  };
};
