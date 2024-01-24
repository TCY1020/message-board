'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Message.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false, // 設置為 false 表示手動生成
    },
    userId: DataTypes.INTEGER,
    comment: DataTypes.STRING,
    createdAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    underscored: true,
  });
  return Message;
};
