const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utilities/catchAsync');
const { isLoggedIn, validateCampground, isAuthor } = require('../middleware');
const Campground = require('../models/campground');

//parse file data
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

// render campground page
router
  .route('/')
  .get(catchAsync(campgrounds.index))
  // a port for sending post request from the user. ex.: form
  .post(
    isLoggedIn,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

// render campground/new page
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router
  .route('/:id')
  // render campgrounds/show based on the specific campground id (once the user click)
  .get(catchAsync(campgrounds.showCampground))
  // use to edit data and get the id using req.params and findByIdAndUpdate()
  .put(
    isAuthor,
    isLoggedIn,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  // delete specific campground based on the id using findByIdAndDelete
  .delete(isAuthor, isLoggedIn, catchAsync(campgrounds.deleteCampground));

// render campgrounds/edit for editing the specific campground id (once the user click)
router.get(
  '/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
