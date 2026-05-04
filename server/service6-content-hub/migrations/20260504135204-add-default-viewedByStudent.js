'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('recommendations', 'viewedByStudent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('recommendations', 'viewedByStudent', {
      type: Sequelize.BOOLEAN,
      defaultValue: null
    });
  }
};