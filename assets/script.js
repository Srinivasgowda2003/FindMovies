const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const moviesContainer = document.getElementById('moviesContainer');
const movieModal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.closeBtn');
const themeToggle = document.getElementById('themeToggle');

const API_KEY = "6f6242e6"; // replace with your key

let currentPage = 1;
let lastQuery = "";
let totalPages = 1;

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Search button click
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if(query) {
        currentPage = 1;
        lastQuery = query;
        fetchMovies(query, currentPage);
    }
});

// Fetch movies with pagination
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

        // 👇 Add a new history state when modal opens
        history.pushState({ modalOpen: true }, "", "#movie");
    } catch (err) {
        alert('Error fetching movie details.');
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

function closeModal() {
    movieModal.style.display = 'none';
    if (location.hash === "#movie") {
        history.back(); // remove fake modal state
    }
}

closeBtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
    if (e.target === movieModal) closeModal();
});

// 👇 Detect back button
window.addEventListener("popstate", (event) => {
    if (!event.state || !event.state.modalOpen) {
        movieModal.style.display = "none";
    }
});


// Display pagination buttons
function displayPagination() {
    // remove old pagination if exists
    const old = document.querySelector('.pagination');
    if(old) old.remove();

    const paginationDiv = document.createElement('div');
    paginationDiv.classList.add('pagination');

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '⬅ Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if(currentPage > 1) {
            currentPage--;
            fetchMovies(lastQuery, currentPage);
        }
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next ➡';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => {
        if(currentPage < totalPages) {
            currentPage++;
            fetchMovies(lastQuery, currentPage);
        }
    });

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(document.createTextNode(` Page ${currentPage} of ${totalPages} `));
    paginationDiv.appendChild(nextBtn);

    // Insert after moviesContainer
    moviesContainer.parentNode.insertBefore(paginationDiv, moviesContainer.nextSibling);
}

