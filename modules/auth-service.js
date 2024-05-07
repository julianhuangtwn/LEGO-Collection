require("dotenv").config();

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

// Table to be initialized
let User;

// Connect to database and initialize the User table
const initialize = () => {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
    db.on("error", (err) => {
      reject(err); 
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

// Add user to database
const registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      // Hash the password using a Salt that was generated using 10 rounds
      bcrypt.hash(userData.password, 10).then(hash=>{ 
        userData.password = hash
        let newUser = new User(userData);
        newUser
          .save()
          .then(() => resolve())
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
        })
        .catch(err=>{
            reject(`There was an error encrypting the password`);
        });
    }
  });
};

// Check if user exists and password is correct
const checkUser = (userData) => {
  return new Promise((resolve, reject) => {
    User.find({ username: userData.username })
      .exec()
      .then((users) => {
        if (users.length > 0) {
          bcrypt.compare(userData.password, users[0].password)
            .then((res) => {
              // Manages a max of 8 login history
              if (res === true) {
                if(users[0].loginHistory.length == 8){
                    users[0].loginHistory.pop();
                }
                users[0].loginHistory.unshift(
                    {dateTime: (new Date()).toString(), userAgent: userData.userAgent}
                );
                User.updateOne(
                  { username: userData.username },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                .exec()
                .then (() => {
                    resolve(users[0])
                })
                .catch((err) => {
                    reject(`There was an error verifying the user: ${err}`);
                }); 
              } else {
                reject(`Incorrect Password for user: ${userData.username}`);
              }
            })
            .catch((err) => {
              reject("Error comparing passwords");
            });
        } else {
          reject(`Unable to find user: ${userData.username}`);    
        }
      })
      .catch((err) => {
        reject("Error finding user");
      });
  });
};

module.exports = { initialize, registerUser, checkUser }