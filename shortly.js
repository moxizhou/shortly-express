var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// app.use(express.cookieParser('moxi')); 
app.use(session({secret: 'moxi'}));
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var restrict = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('./login');
  }
}; 

app.get('/', restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', restrict, 
function(req, res) {
  res.render('index');
});

app.get('/login', 
  function(req, res) {
    res.render('login');
  });

app.get('/links', restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.get('/signup', 
  function(req, res) {
    res.render('signup');
  });

app.get('/logout', 
  function(req, res) {
    req.session.destroy(function() {
      res.redirect('/');
    });
  });

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

// db.knex('users').where('username', '=', username)
//     .then(function(data) {
new User({username: username}).fetch().then(function(user){
    if( !user ){
      console.log("Wrong username or password!")
      res.redirect('/login');
    } else { 
      if( user.comparePassword(password, function(match){
        if( match) {
          return req.session.regenerate(function() {
            req.session.user = user;
            console.log("Successfully logged in!")
            res.redirect('/');
          })
        } else {
          console.log("Wrong username or password!")
          res.redirect('/login')
        }
      }));
    }
  });
});

app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  var user = new User({
    username: username,
    password: password
  });

  db.knex('users').where('username', '=', username)
    .then(function(data) {
      if (!data['0']) {
        user.save().then(function(data) {
          return req.session.regenerate(function() {
            req.session.user = user;
            Users.add(data);
            console.log("Successfully made new user!")
            res.redirect('/');
          })
        })
      } else {
        console.log("User already exists!");
        res.redirect('/signup');
      }
    });

});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

//sessions are tokens with expiring date
//cookies do not expire, but you an can add expire to them
//visit fb within a month, log out, but everytime you are on there, updates session
//client interacts with server passing along cookies (with session id), server look
//up in table, see which session was there before and has a lot of information
//store session id in server and cookies
