const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const moviesContainer = document.getElementById('moviesContainer');
const movieModal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.closeBtn');
const themeToggle = document.getElementById('themeToggle');

const API_KEY = "6f6242e6"; // Get free API key from http://www.omdbapi.com/

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Search button click
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if(query) fetchMovies(query);
});

// Fetch movies
async function fetchMovies(query) {
    moviesContainer.innerHTML = 'Loading...';
    try {
        const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`);
        const data = await res.json();
        if(data.Response === "True") displayMovies(data.Search);
        else moviesContainer.innerHTML = `<p>${data.Error}</p>`;
    } catch(err) {
        moviesContainer.innerHTML = `<p>Error fetching movies.</p>`;
    }
}

// Display movie cards
function displayMovies(movies) {
    moviesContainer.innerHTML = '';
    movies.forEach(movie => {
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/200x300'}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>⭐ ${movie.Year}</p>
        `;
        movieEl.addEventListener('click', () => showDetails(movie.imdbID));
        moviesContainer.appendChild(movieEl);
    });
}

// Show movie details in modal
async function showDetails(id) {
    try {
        const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const data = await res.json();
        modalBody.innerHTML = `
            <h2>${data.Title}</h2>
            <img src="${data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/200x300'}" alt="${data.Title}">
            <p><strong>Year:</strong> ${data.Year}</p>
            <p><strong>Genre:</strong> ${data.Genre}</p>
            <p><strong>Director:</strong> ${data.Director}</p>
            <p><strong>Actors:</strong> ${data.Actors}</p>
            <p><strong>Plot:</strong> ${data.Plot}</p>
        `;
        movieModal.style.display = 'block';
    } catch(err) {
        alert('Error fetching movie details.');
    }
}

// Close modal
closeBtn.addEventListener('click', () => movieModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if(e.target === movieModal) movieModal.style.display = 'none';
});
