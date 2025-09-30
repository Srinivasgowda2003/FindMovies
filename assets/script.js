// Elements
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const moviesContainer = document.getElementById("moviesContainer");
const movieModal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".closeBtn");
const themeToggle = document.getElementById("themeToggle");
const loading = document.getElementById("loading");

// Your OMDb API Key
const API_KEY = "6f6242e6";

// Pagination variables
let currentPage = 1;
let lastQuery = "";

// -----------------------
// Theme Mode Persistence
// -----------------------
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// -----------------------
// Search Functionality
// -----------------------
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if(query) {
        currentPage = 1;
        lastQuery = query;
        fetchMovies(query, currentPage);
    }
});

// Enter key search
searchInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter") searchBtn.click();
});

// -----------------------
// Fetch Movies
// -----------------------
async function fetchMovies(query, page = 1) {
    moviesContainer.innerHTML = "";
    loading.classList.remove("hidden");

    try {
        const res = await fetch(`https://www.omdbapi.com/?s=${query}&page=${page}&apikey=${API_KEY}`);
        const data = await res.json();
        loading.classList.add("hidden");

        if(data.Response === "True") {
            displayMovies(data.Search);
            displayPagination(data.totalResults);
        } else {
            moviesContainer.innerHTML = `<p class="no-results">No movies found for "${query}"</p>`;
        }
    } catch(err) {
        loading.classList.add("hidden");
        moviesContainer.innerHTML = `<p>Error fetching movies.</p>`;
    }
}

// -----------------------
// Display Movies
// -----------------------
function displayMovies(movies) {
    moviesContainer.innerHTML = "";
    movies.forEach(movie => {
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");
        movieEl.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/200x300'}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>⭐ ${movie.Year}</p>
        `;
        movieEl.addEventListener("click", () => showDetails(movie.imdbID));
        moviesContainer.appendChild(movieEl);
    });
}

// -----------------------
// Show Movie Details in Modal
// -----------------------
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
            <p><strong>IMDb Rating:</strong> ${data.imdbRating}</p>
            <p><strong>Plot:</strong> ${data.Plot}</p>
        `;

        movieModal.style.display = "block";

        // Push fake history state so Back button works
        history.pushState({ modalOpen: true }, "", "#movie");
    } catch(err) {
        alert("Error fetching movie details.");
    }
}

// -----------------------
// Close Modal
// -----------------------
function closeModal() {
    movieModal.style.display = "none";
}

closeBtn.addEventListener("click", () => {
    closeModal();
    if(history.state && history.state.modalOpen) history.back();
});

window.addEventListener("click", (e) => {
    if(e.target === movieModal) {
        closeModal();
        if(history.state && history.state.modalOpen) history.back();
    }
});

window.addEventListener("popstate", () => {
    closeModal();
});

// -----------------------
// Pagination
// -----------------------
function displayPagination(totalResults) {
    const old = document.querySelector(".pagination");
    if(old) old.remove();

    const totalPages = Math.ceil(totalResults / 10); // 10 results per page
    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("pagination");

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⬅ Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if(currentPage > 1) {
            currentPage--;
            fetchMovies(lastQuery, currentPage);
        }
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ➡";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if(currentPage < totalPages) {
            currentPage++;
            fetchMovies(lastQuery, currentPage);
        }
    });

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(nextBtn);
    moviesContainer.after(paginationDiv);
}

