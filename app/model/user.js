// app/model/user.js
'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;
  const User = app.model.define('User', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: STRING(30),
    account: STRING, // assuming account is equivalent to STRING in the original code
    password: STRING, // assuming password is equivalent to STRING in the original code
  }, {
    tableName: 'Users', // 指定表名
  });

  User.associate = models => {
    // define association here
    User.hasMany(app.model.Message, { foreignKey: 'userId' });
  };

  return User;
};

