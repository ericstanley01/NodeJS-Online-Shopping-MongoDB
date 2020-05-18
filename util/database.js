const mongodb = require('mongodb');
const dotenv = require('dotenv');

const MongoClient = mongodb.MongoClient;

dotenv.config();

const mongoConnect = (callback) => {
 let connnectionString = 'mongodb+srv://' + process.env.MONGODB_USERNAME +
  ':' + process.env.MONGODB_PASSWORD +
  '@' + process.env.MONGODB_CLUSTER + '-rej5u.mongodb.net/' +
  process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

 MongoClient.connect(connnectionString,
  {
   useUnifiedTopology: true,
   useNewUrlParser: true
  })
  .then(client => {
   console.log('Connected');
   callback(client);
  })
  .catch(err => {
   console.log(err);
  });
}

module.exports = mongoConnect;