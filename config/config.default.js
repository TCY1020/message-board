/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1704218497430_4221';

  // add your middleware config here
  config.middleware = [ 'login' ];
  config.login = {
    match: '/login',
  };

  config.session = {
    key: 'data',
    maxAge: 24 * 3600 * 1000,
    httpOnly: true,
    encrypt: true,
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  config.view = {
    mapping: {
      '.html': 'ejs',
    },
  };
  // config/config.default.js
  config.security = {
    csrf: {
      enable: false,
    },
  };
  // sequelize
  config.sequelize = {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'message_board',
    username: 'root', // 数据库用户名
    password: 'password', // 数据库密码
    timezone: '+08:00', // 设置时区
    define: {
      timestamps: true, // 自动写入时间戳 created_at updated_at
      paranoid: true, // 字段生成软删除时间戳 deleted_at
      underscored: true, // 所有驼峰命名格式化
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
