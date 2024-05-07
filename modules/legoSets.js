require("dotenv").config();

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
  },
  {
    createdAt: false, 
    updatedAt: false, 
  }
);

const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
  },
  {
    createdAt: false, 
    updatedAt: false, 
  }
);

Set.belongsTo(Theme, { foreignKey: "theme_id" });


//Sync the database with schemas and relationships defined 
function initialize() {
  return sequelize.sync();
}

//Returns the complete set
function getAllSets() {
  return Set.findAll({ include: [Theme] });
}

//Find set by setNum
function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findOne({ where: { set_num: setNum }, include: [Theme] })
      .then((set) => {
        if (set) {
          resolve(set);
        } else {
          reject("Unable to find requested set");
        }
      })
      .catch((error) => {
        reject("Unable to find requested set");
      });
  });
}

//Find sets by theme
function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    //$Theme.name$ is special syntax to indicate the included Theme table association is being accessed
    Set.findAll({
      include: [Theme],
      where: {
        //iLike is case insensitive like
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    })
      .then((sets) => {
        if (sets.length !== 0) {
          resolve(sets);
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject("Unable to find requested sets");
      });
  });
}

function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create({
      set_num: setData.set_num,
      name: setData.name,
      year: setData.year,
      num_parts: setData.num_parts,
      theme_id: setData.theme_id,
      img_url: setData.img_url,
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

//Returns all themes
function getAllThemes() {
  return Theme.findAll({
    order: [["name", "ASC"]],
  });
}

//Edit set setNum with setData
function editSet(setNum, setData) {
  return new Promise((resolve, reject) => {
    Set.update(
      {
        name: setData.name,
        year: setData.year,
        num_parts: setData.num_parts,
        theme_id: setData.theme_id,
        img_url: setData.img_url,
      },
      {
        where: {
          set_num: setNum,
        },
      }
    )
      .then(([updated]) => {
        if (updated === 1) {
          resolve();
        } else {
          reject("Unable to find requested set");
        }
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

//Delete set setNum
function deleteSet(setNum) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: setNum,
      },
    })
      .then((deleted) => {
        if (deleted === 1) {
          resolve();
        } else {
          reject("Unable to find requested set");
        }
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
};