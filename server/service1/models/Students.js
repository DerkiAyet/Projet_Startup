module.exports = (sequelize, DataTypes) => {
    const Students = sequelize.define('Students', {
        idStudent: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        familyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        givenName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        levelOfEducation: {
            type: DataTypes.ENUM(
                'pre_school',       // preschool / kindergarten
                'primary',
                'middle_school',
                'high_school',
                'undergraduate',
                'postgraduate',
                'other'
            ),
            allowNull: true,
        },
        institution: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'students',
        timestamps: true,
    })

    Students.associate = (models) => {

        Students.belongsToMany(models.Parents, {
            through:  'child_parent',
            foreignKey: 'idStudent', // join the table with the current user id as the foreign key
            otherKey: 'idParent' // join the table with the parent id as the other foreign key
        });

        Students.belongsToMany(models.Subjects, {
            through: 'student_interests',
            foreignKey: 'idStudent',
            otherKey: 'idInterest'
        });
    }

    return Students;

}