const API_KEY = "6f6242e6"; // 🔑 Replace with your OMDB API key
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const movieList = document.getElementById("movieList");
const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close");

let currentPage = 1;
let lastQuery = "";

// Fetch movies from API
async function fetchMovies(query, page = 1) {
    try {
        const res = await fetch(`https://www.omdbapi.com/?s=${query}&page=${page}&apikey=${API_KEY}`);
        const data = await res.json();

        if (data.Response === "True") {
            movieList.innerHTML = "";
            data.Search.forEach(movie => {
                const movieCard = document.createElement("div");
                movieCard.classList.add("movie-card");
                movieCard.innerHTML = `
                    <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/200x300'}" alt="${movie.Title}">
                    <h3>${movie.Title}</h3>
                    <p>${movie.Year}</p>
                `;
                movieCard.addEventListener("click", () => showDetails(movie.imdbID));
                movieList.appendChild(movieCard);
            });
            displayPagination(data.totalResults, query);
        } else {
            movieList.innerHTML = `<p class="not-found">❌ No results found for "${query}"</p>`;
        }
    } catch (err) {
        console.error("Error fetching movies:", err);
    }
}

// Show movie details
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
        modal.style.display = "block";

        // Push state for back button
        history.pushState({ modalOpen: true }, "", "#movie");
    } catch (err) {
        alert("Error fetching movie details.");
    }
}

// Close modal
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    history.back();
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        history.back();
    }
});

// Handle back button (close modal instead of exiting site)
window.addEventListener("popstate", (e) => {
    if (!e.state?.modalOpen) {
        modal.style.display = "none";
    }
});

// Display pagination
function displayPagination(totalResults, query) {
    const old = document.querySelector(".pagination");
    if (old) old.remove();

    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("pagination");

    const totalPages = Math.ceil(totalResults / 10);

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⬅ Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchMovies(query, currentPage);
        }
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next ➡";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchMovies(query, currentPage);
        }
    });

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(document.createTextNode(` Page ${currentPage} of ${totalPages} `));
    paginationDiv.appendChild(nextBtn);

    movieList.after(paginationDiv);
}

// Search
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        lastQuery = query;
        currentPage = 1;
        fetchMovies(query, currentPage);
    }
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

