const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config_server/config.env') }); //adding this so the sequelize will definitly read the environmemnt variables

module.exports = {
  development: {
    username: process.env.SQL_USER,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DB,
    host: process.env.SQL_HOST,
    dialect: "mysql"
  },
  // ...
};
module.exports = {
  development: {
    username: process.env.SQL_USER,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DB,
    host: process.env.SQL_HOST,
    dialect: "mysql"
  },
  test: {
    username: process.env.SQL_USER,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DB,
    host: process.env.SQL_HOST,
    dialect: "mysql"
  },
  production: {
    username: process.env.SQL_USER,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DB,
    host: process.env.SQL_HOST,
    dialect: "mysql"
  }
};