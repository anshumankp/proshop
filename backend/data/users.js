import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User2',
    email: 'Admin2@example.com',
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

export default users;
