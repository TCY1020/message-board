const { Pagination } = require('./app/helpers/pagination');
const { MessageFormatter } = require('./app/helpers/messageFormatter');

module.exports = app => {
  app.context.helpers = {
    Pagination,
    MessageFormatter,
  };
};
