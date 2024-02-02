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

  config.cluster = {
    listen: {
      port: 7001,
      hostname: '127.0.0.1',
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1704218497430_4221';

  // add your middleware config here
  config.middleware = [ 'login' ];
  // 只有在/login路由執行login的middleware
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
    },
  };
  // redis
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: 'auth',
      db: 0,
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
