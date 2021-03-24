// Will display error stack in development
// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config();
// }
// Error stack in production
require('dotenv').config();
// render data on the localhost
const express = require('express');
const app = express();
// it is use to find the folder views even if you are in the different directory
const path = require('path');
// middleware for nodejs and mongodb
const mongoose = require('mongoose');
//
const ejsMate = require('ejs-mate');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

// For mongodb security
const mongoSanitize = require('express-mongo-sanitize');

// For flash app
const flash = require('connect-flash');

//
const helmet = require('helmet');
const ExpressError = require('./utilities/ExpressError');

// use as a middleware to use put and patch method on the express
const methodOverride = require('method-override');

const MongoDBStore = require('connect-mongo')(session);

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
// URL route for DB
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelpcamp';

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database Connected');
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// when use app.use it will always run on every single url path
// urlencoded - to parse form encoded information from the body
app.use(express.urlencoded({ extended: true }));
//to parse json encoded data
// app.use(express.json())
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabttersecret';

const store = new MongoDBStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e);
});

// Config for session and cookies
const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
//Tell passport how to serialize user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use(helmet({contentSecurityPolicy: false})); // wont require any policy
app.use(helmet());

const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net/npm/bs-custom-file-input/dist/bs-custom-file-input.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js',
];
const styleSrcUrls = [
  'https://kit-free.fontawesome.com/',
  'https://stackpath.bootstrapcdn.com/',
  'https://api.mapbox.com/mapbox-gl-js/v2.1.1/mapbox-gl.css',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
  'https://api.mapbox.com/mapbox-gl-js/v2.1.1/mapbox-gl.js',
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/jmdiaz/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        'https://images.unsplash.com/',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

// render index page
app.get('/', (req, res) => {
  res.render('home');
});

// will render as an error if the request path is not existed
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

// use as an error function for next() function
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh No!, Something went wrong!';
  res.status(statusCode).render('error', { err });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Serving on port 3000');
});
