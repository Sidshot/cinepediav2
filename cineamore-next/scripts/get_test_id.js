
const mongoose = require('mongoose');

// Adjust path as needed or just use URI directly if known, 
// using the one from lib/mongodb doesn't work easily in standalone script without babel/next
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cinepedia";

async function getOneMovie() {
    try {
        await mongoose.connect(MONGODB_URI);
        const movie = await mongoose.connection.db.collection('movies').findOne({});
        console.log('MOVIE_ID:' + movie._id.toString());
        console.log('MOVIE_TITLE:' + movie.title);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

getOneMovie();
