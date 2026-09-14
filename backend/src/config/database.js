const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env.local' });

function resolveMysqlHostPort() {
  const mysqlAddress = process.env.MYSQL_ADDRESS || '';
  if (!mysqlAddress) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306
    };
  }

  const [host, port] = mysqlAddress.split(':');
  return {
    host: host || process.env.DB_HOST || 'localhost',
    port: port || process.env.DB_PORT || 3306
  };
}

const { host, port } = resolveMysqlHostPort();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || process.env.DB_NAME || 'binghamton_circle',
  process.env.MYSQL_USERNAME || process.env.DB_USER || 'root',
  process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  {
    host,
    port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
