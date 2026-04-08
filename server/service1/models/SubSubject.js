module.exports = (sequelize, DataTypes) => {
    const SubSubjects = sequelize.define('SubSubjects', {
        idSub: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'sub_subject',
        timestamps: false,
    })

    SubSubjects.associate = (models) => {

        SubSubjects.belongsTo(models.Subjects, {
            foreignKey: 'idSubject',
            onDelete: 'CASCADE'
        });

    }

    return SubSubjects;
}