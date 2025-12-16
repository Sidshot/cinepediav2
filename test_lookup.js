const movies = require('./cineamore-next/lib/movies.json');
const id = "c2a34070eb944e98deb4bd91";

console.log(`Loaded ${movies.length} movies.`);

const movie = movies.find(m => m._id === id || m.__id === id);

if (movie) {
    console.log("✅ FOUND MOVIE:", movie.title);
    console.log("Plot:", movie.plot);
    console.log("LB:", movie.letterboxd);
} else {
    console.error("❌ MOVIE NOT FOUND with ID:", id);
}
