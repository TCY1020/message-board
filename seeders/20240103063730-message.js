'use strict';
const { User } = require('../models');
const { faker } = require('@faker-js/faker');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const user = await User.findAll({ raw: true });
    await queryInterface.bulkInsert('Messages',
      Array.from({ length: user.length }, (_, item) => ({
        user_id: user[item].id,
        comment: faker.lorem.sentence({ min: 5, max: 15 }),
        created_at: new Date(),
        updated_at: new Date(),
      }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', {});
  },
};
