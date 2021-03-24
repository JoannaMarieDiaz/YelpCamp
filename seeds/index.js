const mongoose = require('mongoose');
const cities = require('./cities');
const Campground = require('../models/campground');
const { places, descriptors } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelpcamp', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database Connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: '6058696acd16c3622c790436',
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus soluta adipisci dolorem natus ipsum. Voluptatem, incidunt natus facere illum sed sunt repellendus nam quasi voluptate officiis ut beatae minus ipsa. ',
      price,
      geometry: {
        type: 'Point',
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url:
            'https://res.cloudinary.com/jmdiaz/image/upload/v1616387735/b08zt2iphwi6sv27jl88.jpg',
          filename: 'b08zt2iphwi6sv27jl88',
        },
        {
          url:
            'https://res.cloudinary.com/jmdiaz/image/upload/v1616387736/fcmjri8olty0ffhtqonu.jpg',
          filename: 'fcmjri8olty0ffhtqonu',
        },
      ],
    });
    await camp.save();
  }
};
// automatically close the server after run
seedDB().then(() => {
  mongoose.connection.close();
});
