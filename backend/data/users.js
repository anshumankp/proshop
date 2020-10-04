const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Admin User',
    email: 'Admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true
  },
  {
    name: 'John Doe',
    email: 'JD@example.com',
    password: bcrypt.hashSync('123456', 10)
  },
  {
    name: 'Jane Doe',
    email: 'JD2@example.com',
    password: bcrypt.hashSync('123456', 10)
  }
];

module.exports = users;
