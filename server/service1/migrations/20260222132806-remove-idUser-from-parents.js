'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.removeColumn("parents", "idUser");
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn("parents", "idUser", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};