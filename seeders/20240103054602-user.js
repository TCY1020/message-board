'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [{
      name: 'Client1',
      account: 'user1',
      password: await bcrypt.hash('12345678', 10),
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      name: 'Client2',
      account: 'user2',
      password: await bcrypt.hash('12345678', 10),
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      name: 'Client3',
      account: 'user3',
      password: await bcrypt.hash('12345678', 10),
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      name: 'Client4',
      account: 'user4',
      password: await bcrypt.hash('12345678', 10),
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      name: 'Client5',
      account: 'user5',
      password: await bcrypt.hash('12345678', 10),
      created_at: new Date(),
      updated_at: new Date(),
    },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {});
  },
};
