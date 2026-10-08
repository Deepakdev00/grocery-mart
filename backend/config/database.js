const prisma = require('./prisma');

const checkDatabaseConnection = async () => {
  await prisma.$queryRaw`SELECT 1`;
  return true;
};

const disconnectDatabase = () => prisma.$disconnect();

module.exports = { checkDatabaseConnection, disconnectDatabase };
