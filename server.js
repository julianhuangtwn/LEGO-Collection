require("dotenv").config();

const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const express = require('express'); 
const app = express(); 
const clientSessions = require('client-sessions');

app.set('view engine', 'ejs');
const HTTP_PORT = 8080; 
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(
    clientSessions({
      cookieName: 'session', 
      secret: process.env.SESSION_SECRET, 
      duration: 60 * 60 * 1000, 
      activeDuration: 1000 * 60 * 60, 
    })
  );

// Middleware storing the session in the locals
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Middleware ensuring a user is logged in by checking the session user
function ensureLogin (req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

// Initializes the database, then enables the endpoints 
legoData.initialize()
.then(authData.initialize)
.then(() =>{
    app.get('/', (req, res) => {
        res.render('home');
    });

    app.get('/about', (req, res) => {
        res.render('about');    
    });

    app.get('/lego/sets', (req, res) => {
        if (req.query.theme)
        {
            legoData.getSetsByTheme(req.query.theme)
            .then((sets) => {
                res.render("sets", {legoSets: sets});
            })
            .catch((error) => {
                res.status(404).render("404", {message: "Unable to find requested sets"});
            })
        }
        else
        {        
            legoData.getAllSets()
            .then((sets) => {
                res.render("sets", {legoSets: sets});
            })
            .catch((error) => {
                res.status(404).render("404", {message: "Unable to find requested sets"});
            })
        }       
    });

    app.get('/lego/sets/:setNum', (req, res) => {
        legoData.getSetByNum(req.params.setNum)
        .then((result) => {
            res.render("set", {set: result});
        })
        .catch((error) => {
            res.status(404).render("404", {message: "Unable to find requested set"});
        })
    });

    app.get('/lego/addSet', ensureLogin, ((req, res) => {
        legoData.getAllThemes()
        .then((themeData) => {
            res.render("addSet", {themes: themeData});
        })
    }));

    app.post('/lego/addSet', ensureLogin, ((req, res) => {
        legoData.addSet(req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        })
    }));

    app.get('/lego/editSet/:setNum', ensureLogin, ((req, res) => {
        legoData.getSetByNum(req.params.setNum)
        .then((setData) => {
            legoData.getAllThemes()
            .then((themeData) => {
                res.render("editSet", {themes: themeData, set: setData});
            })        
            .catch((error) => {
                res.status(404).render("404", { message: error });
            })
        })
        .catch((error) => {
            res.status(404).render("404", { message: error });
        })
    }));

    app.post('/lego/editSet', ensureLogin, ((req, res) => {
        legoData.editSet(req.body.set_num, req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        })
    }));

    app.get('/lego/deleteSet/:setNum', ensureLogin, ((req, res) => {
        legoData.deleteSet(req.params.setNum)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((error) => {
            res.status(404).render("404", { message: error });
        })
    }));

    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.get('/register', (req, res) => {
        res.render('register');
    });

    app.post('/register', (req, res) => {
        authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User created" });
        })
        .catch((error) => {
            res.render('register', { errorMessage: error, username: req.body.username });
        })
    });

    app.post('/login', (req, res) => {
        req.body.userAgent = req.get('User-Agent'); 
        authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                username: user.username,
                email: user.email,
                loginHistory: user.loginHistory
            }
            res.redirect('/userHistory');
        })
        .catch((error) => {
            res.render('login', { errorMessage: error, username: req.body.username });
        })
    });

    app.get('/logout', (req, res) => {
        req.session.reset();
        res.redirect('/');
    });

    app.get('/userHistory', ensureLogin, (req, res) => {
        res.render('userHistory');  
    });

    //If all the HTTP requests fails, this will be run instead, and sends the 404.html page
    app.use((req, res, next) => {
        res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
        });

    app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));
})
.catch((error) =>{
    console.log(error);
})