// Configuration
const CONFIG = {
    API_KEY: 'YOUR_API_KEY_HERE', // Replace with your OMDb API key
    API_URL: 'https://www.omdbapi.com/',
    ITEMS_PER_PAGE: 10
};

// State Management
let state = {
    currentSearch: '',
    currentPage: 1,
    totalResults: 0,
    currentFilter: 'all',
    favorites: JSON.parse(localStorage.getItem('movieFavorites')) || [],
    searchTimeout: null
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    moviesList: document.getElementById('moviesList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    emptyState: document.getElementById('emptyState'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    resultsInfo: document.getElementById('resultsInfo'),
    resultsCount: document.getElementById('resultsCount'),
    backToTop: document.getElementById('backToTop'),
    movieModal: document.getElementById('movieModal'),
    modalContent: document.getElementById('modalContent'),
    yearFilter: document.getElementById('yearFilter'),
    typeFilter: document.getElementById('typeFilter'),
    favoritesBtn: document.getElementById('favoritesBtn'),
    navBtns: document.querySelectorAll('.nav-btn')
};

// Initialize the application
function init() {
    setupEventListeners();
    populateYearFilter();
    loadInitialContent();
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearch.addEventListener('click', clearSearch);
    
    // Filters
    elements.yearFilter.addEventListener('change', performSearch);
    elements.typeFilter.addEventListener('change', performSearch);
    
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavClick);
    });
    
    // Load more
    elements.loadMoreBtn.addEventListener('click', loadMoreMovies);
    
    // Back to top
    elements.backToTop.addEventListener('click', scrollToTop);
    
    // Modal
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    window.addEventListener('click', closeModalOnOutsideClick);
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyboardEvents);
}

// Search Functions
function handleSearchInput(event) {
    const query = event.target.value.trim();
    
    // Show/hide clear button
    elements.clearSearch.style.display = query ? 'block' : 'none';
    
    if (query.length < 2) {
        clearResults();
        return;
    }
    
    // Debounce search
    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
        state.currentSearch = query;
        state.currentPage = 1;
        performSearch();
    }, 500);
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.clearSearch.style.display = 'none';
    clearResults();
    loadInitialContent();
}

function performSearch() {
    if (!state.currentSearch) return;
    
    const year = elements.yearFilter.value;
    const type = elements.typeFilter.value;
    
    searchMovies(state.currentSearch, state.currentPage, year, type);
}

async function searchMovies(query, page = 1, year = '', type = '') {
    try {
        showLoading();
        hideError();
        hideEmptyState();
        
        const params = new URLSearchParams({
            apikey: CONFIG.API_KEY,
            s: query,
            page: page.toString(),
            ...(year && { y: year }),
            ...(type && { type: type })
        });
        
        const response = await fetch(`${CONFIG.API_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.Response === "False") {
            if (page === 1) {
                showEmptyState();
            }
            throw new Error(data.Error);
        }
        
        if (page === 1) {
            state.totalResults = parseInt(data.totalResults);
            displayMovies(data.Search, true);
            updateResultsInfo(data.Search.length, state.totalResults, query);
        } else {
            displayMovies(data.Search, false);
            updateResultsInfo(
                document.querySelectorAll('.movie-card').length,
                state.totalResults,
                query
            );
        }
        
        toggleLoadMoreButton(data.Search.length);
        
    } catch (error) {
        showError(`Failed to search movies: ${error.message}`);
        if (page === 1) {
            clearResults();
        }
    } finally {
        hideLoading();
    }
}

// Display Functions
function displayMovies(movies, clear = true) {
    if (clear) {
        elements.moviesList.innerHTML = '';
    }
    
    if (!movies || movies.length === 0) {
        showEmptyState();
        return;
    }
    
    const moviesHTML = movies.map(movie => createMovieCard(movie)).join('');
    
    if (clear) {
        elements.moviesList.innerHTML = moviesHTML;
    } else {
        elements.moviesList.innerHTML += moviesHTML;
    }
    
    // Add click events to new movie cards
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', function() {
            const imdbID = this.dataset.imdbid;
            showMovieDetails(imdbID);
        });
    });
    
    // Add favorite button events
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const imdbID = this.closest('.movie-card').dataset.imdbid;
            toggleFavorite(imdbID, this);
        });
    });
    
    hideEmptyState();
    elements.resultsInfo.style.display = 'block';
}

function createMovieCard(movie) {
    const isFavorite = state.favorites.includes(movie.imdbID);
    
    return `
        <div class="movie-card" data-imdbid="${movie.imdbID}">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                    onclick="event.stopPropagation()">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
            <img src="${getPosterUrl(movie.Poster)}" 
                 alt="${movie.Title}" 
                 class="movie-poster"
                 loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <p class="movie-year">${movie.Year}</p>
                <span class="movie-type">${formatType(movie.Type)}</span>
            </div>
        </div>
    `;
}

function updateResultsInfo(displayed, total, query) {
    elements.resultsCount.textContent = `Showing ${displayed} of ${total} results for "${query}"`;
}

function toggleLoadMoreButton(currentCount) {
    if (currentCount < state.totalResults) {
        elements.loadMoreContainer.style.display = 'block';
    } else {
        elements.loadMoreContainer.style.display = 'none';
    }
}

// Movie Details Modal
async function showMovieDetails(imdbID) {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            apikey: CONFIG.API_KEY,
            i: imdbID,
            plot: 'full'
        });
        
        const response = await fetch(`${CONFIG.API_URL}?${params}`);
        const data = await response.json();
        
        if (data.Response === "True") {
            displayMovieModal(data);
        } else {
            throw new Error('Failed to fetch movie details');
        }
    } catch (error) {
        showError('Failed to load movie details: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayMovieModal(movie) {
    const isFavorite = state.favorites.includes(movie.imdbID);
    
    elements.modalContent.innerHTML = `
        <div class="movie-details">
            <div class="movie-details-header">
                <img src="${getPosterUrl(movie.Poster)}" 
                     alt="${movie.Title}" 
                     class="movie-details-poster">
                <div class="movie-details-info">
                    <h2>${movie.Title} (${movie.Year})</h2>
                    <div class="movie-meta">
                        ${movie.imdbRating !== 'N/A' ? 
                          `<span class="rating">⭐ ${movie.imdbRating}/10</span>` : ''}
                        ${movie.Runtime !== 'N/A' ? 
                          `<span class="runtime">${movie.Runtime}</span>` : ''}
                        ${movie.Genre !== 'N/A' ? 
                          `<span class="genre">${movie.Genre}</span>` : ''}
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite('${movie.imdbID}', this)">
                        ${isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                    </button>
                    ${movie.Plot !== 'N/A' ? 
                      `<p class="plot"><strong>Plot:</strong> ${movie.Plot}</p>` : ''}
                    ${movie.Director !== 'N/A' ? 
                      `<p><strong>Director:</strong> ${movie.Director}</p>` : ''}
                    ${movie.Actors !== 'N/A' ? 
                      `<p><strong>Cast:</strong> ${movie.Actors}</p>` : ''}
                    ${movie.Writer !== 'N/A' ? 
                      `<p><strong>Writer:</strong> ${movie.Writer}</p>` : ''}
                    ${movie.Language !== 'N/A' ? 
                      `<p><strong>Language:</strong> ${movie.Language}</p>` : ''}
                    ${movie.Country !== 'N/A' ? 
                      `<p><strong>Country:</strong> ${movie.Country}</p>` : ''}
                    ${movie.Awards !== 'N/A' ? 
                      `<p><strong>Awards:</strong> ${movie.Awards}</p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    elements.movieModal.style.display = 'block';
}

// Favorites Management
function toggleFavorite(imdbID, button) {
    const index = state.favorites.indexOf(imdbID);
    
    if (index > -1) {
        // Remove from favorites
        state.favorites.splice(index, 1);
        if (button) {
            button.classList.remove('active');
            if (button.textContent.includes('Remove')) {
                button.textContent = '🤍 Add to Favorites';
            } else {
                button.textContent = '🤍';
            }
        }
    } else {
        // Add to favorites
        state.favorites.push(imdbID);
        if (button) {
            button.classList.add('active');
            if (button.textContent.includes('Add')) {
                button.textContent = '❤️ Remove from Favorites';
            } else {
                button.textContent = '❤️';
            }
        }
    }
    
    // Update localStorage
    localStorage.setItem('movieFavorites', JSON.stringify(state.favorites));
    
    // Update all favorite buttons for this movie
    document.querySelectorAll(`[data-imdbid="${imdbID}"] .favorite-btn`).forEach(btn => {
        if (btn !== button) {
            btn.classList.toggle('active', state.favorites.includes(imdbID));
            btn.textContent = state.favorites.includes(imdbID) ? '❤️' : '🤍';
        }
    });
}

function showFavorites() {
    if (state.favorites.length === 0) {
        showEmptyState();
        elements.moviesList.innerHTML = '';
        elements.resultsInfo.style.display = 'none';
        return;
    }
    
    // Fetch details for each favorite
    Promise.all(
        state.favorites.map(imdbID => 
            fetch(`${CONFIG.API_URL}?apikey=${CONFIG.API_KEY}&i=${imdbID}`)
                .then(response => response.json())
        )
    ).then(movies => {
        displayMovies(movies.filter(movie => movie.Response === "True"));
        updateResultsInfo(movies.length, movies.length, 'favorites');
    });
}

// Navigation
function handleNavClick(event) {
    const filter = event.target.dataset.filter;
    
    // Update active state
    elements.navBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    state.currentFilter = filter;
    
    if (filter === 'favorites') {
        showFavorites();
    } else {
        // Update type filter and perform search
        elements.typeFilter.value = filter === 'all' ? '' : filter;
        if (state.currentSearch) {
            performSearch();
        } else {
            loadInitialContent();
        }
    }
}

// Utility Functions
function getPosterUrl(poster) {
    return poster !== 'N/A' ? poster : 'https://via.placeholder.com/300x450/333/fff?text=No+Image';
}

function formatType(type) {
    const typeMap = {
        'movie': 'Movie',
        'series': 'TV Series',
        'episode': 'Episode'
    };
    return typeMap[type] || type;
}

function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1920; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearFilter.appendChild(option);
    }
}

function loadMoreMovies() {
    state.currentPage++;
    elements.loadMoreBtn.disabled = true;
    elements.loadMoreBtn.textContent = 'Loading...';
    
    performSearch();
    
    // Re-enable button after a short delay
    setTimeout(() => {
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.textContent = 'Load More Movies';
    }, 1000);
}

function loadInitialContent() {
    // You can load trending movies here or leave it empty
    clearResults();
    elements.resultsInfo.style.display = 'none';
}

function clearResults() {
    elements.moviesList.innerHTML = '';
    elements.loadMoreContainer.style.display = 'none';
    elements.resultsInfo.style.display = 'none';
    hideError();
    hideEmptyState();
}

// UI State Management
function showLoading() {
    elements.loadingSpinner.style.display = 'block';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

function showEmptyState() {
    elements.emptyState.style.display = 'block';
}

function hideEmptyState() {
    elements.emptyState.style.display = 'none';
}

function closeModal() {
    elements.movieModal.style.display = 'none';
}

function closeModalOnOutsideClick(event) {
    if (event.target === elements.movieModal) {
        closeModal();
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleKeyboardEvents(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export functions for global access (for onclick handlers in HTML)
window.showMovieDetails = showMovieDetails;
window.toggleFavorite = toggleFavorite;
