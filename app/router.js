/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/login', controller.home.login);
  router.get('/message', controller.home.getMessages);
  router.get('/message/:id/edit', controller.home.editMessage);
  router.put('/message/:id/edit', controller.home.putMessage);
  router.delete('/message/:id/delete', controller.home.deleteMessage);
};
