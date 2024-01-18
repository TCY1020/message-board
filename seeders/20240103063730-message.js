'use strict';
const { User } = require('../models');
const { faker } = require('@faker-js/faker');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const user = await User.findAll({ raw: true });
    const list = [];
    await Promise.all(user.map(async person => {
      for (let i = 0; i < 20; i++) {
        list.push(person.id);
      }
    }));
    await queryInterface.bulkInsert('Messages',
      Array.from({ length: list.length }, (_, item) => ({
        id: item + 1,
        user_id: list[item],
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
