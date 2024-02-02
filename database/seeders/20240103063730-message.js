'use strict';
const { faker } = require('@faker-js/faker');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // const user = await User.findAll({ raw: true });
    const list = [ 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5 ];
    // await Promise.all(user.map(async person => {
    //   for (let i = 0; i < 3; i++) {
    //     list.push(person.id);
    //   }
    // }));
    await queryInterface.bulkInsert('Messages',
      Array.from({ length: list.length }, (_, item) => ({
        id: item + 1,
        userId: list[item],
        comment: faker.lorem.sentence({ min: 5, max: 15 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', {});
  },
};
