// app/model/message.js
'use strict';

module.exports = app => {
  const { INTEGER, STRING, DATE } = app.Sequelize;

  const Message = app.model.define('message', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    userId: INTEGER,
    comment: STRING,
    // createdAt: DATE,
    createdAt: {
      type: DATE,
      defaultValue: app.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    tableName: 'Messages', // 指定表名
  });

  Message.associate = models => {
    // 定义关联关系
    Message.belongsTo(app.model.User, { foreignKey: 'userId' });
  };

  return Message;
};

