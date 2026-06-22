module.exports = (sequelize, DataTypes) => {
  const ContentModerationAction = sequelize.define(
    "ContentModerationAction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      reportId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "reports", key: "id" }
      },

      targetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "ID of the post/comment being moderated"
      },

      targetType: {
        type: DataTypes.ENUM("post", "comment", "content"),
        allowNull: false
      },

      action: {
        type: DataTypes.ENUM("hide", "delete", "ignore", "restore"),
        allowNull: false
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      tableName: "content_moderation_actions",
      timestamps: true
    }
  );

  ContentModerationAction.associate = (models) => {
    ContentModerationAction.belongsTo(models.Reports, {
      foreignKey: "reportId",
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    });
  };

  return ContentModerationAction;
};