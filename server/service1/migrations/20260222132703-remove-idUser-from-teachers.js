'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.removeColumn("teachers", "idUser");
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn("teachers", "idUser", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
