// --- BEGIN: Script.js API Integration ---
class ScriptAPI {
    constructor() {
        this.apiKey = 'ctrlpb1r01qglao4qp80ctrlpb1r01qglao4qp8g';
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
        
        // Stock symbols for different sections
        this.stocksSymbols = ['TSLA', 'AAPL', 'NVDA', 'AMD', 'META', 'AMZN', 'GOOGL', 'NFLX'];
        this.watchlistSymbols = ['AAPL', 'GOOGL', 'TSLA', 'AMZN', 'NFLX', 'SPOT', 'PFE', 'LLY', 'TEAM', 'TSM'];

        this.initializeScriptAPI();
    }

    async initializeScriptAPI() {
        try {
            console.log('Initializing Script API...');
            
            // Load cached data first
            this.loadCachedData();
            
            // Fetch fresh data
            await this.fetchAllScriptData();
            
        } catch (error) {
            console.error('Error initializing Script API:', error);
            this.showError('Failed to load stock data');
        }
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    async fetchStockQuote(symbol) {
        try {
            await this.waitForRateLimit();
            
            const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.c) {
                throw new Error(`No quote data found for ${symbol}`);
            }
            
            return data;
            
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return this.getFallbackQuote(symbol);
        }
    }

    async fetchAllScriptData() {
        try {
            console.log('Fetching all script data...');
            
            // Fetch stocks data
            const stocksPromises = this.stocksSymbols.map(async (symbol) => {
                try {
                    const quoteData = await this.fetchStockQuote(symbol);
                    return { symbol, data: quoteData, success: true };
                } catch (error) {
                    console.error(`Failed to fetch ${symbol}:`, error);
                    return { symbol, error, success: false };
                }
            });

            const stocksResults = await Promise.all(stocksPromises);
            
            // Process stocks results
            const stocksData = [];
            stocksResults.forEach(result => {
                if (result.success && result.data) {
                    stocksData.push(this.processStockData(result.data, result.symbol));
                } else {
                    stocksData.push(this.processStockData(this.getFallbackQuote(result.symbol), result.symbol));
                }
            });

            // Fetch watchlist data
            const watchlistPromises = this.watchlistSymbols.map(async (symbol) => {
                try {
                    const quoteData = await this.fetchStockQuote(symbol);
                    return { symbol, data: quoteData, success: true };
                } catch (error) {
                    console.error(`Failed to fetch ${symbol}:`, error);
                    return { symbol, error, success: false };
                }
            });

            const watchlistResults = await Promise.all(watchlistPromises);
            
            // Process watchlist results
            const watchlistData = [];
            watchlistResults.forEach(result => {
                if (result.success && result.data) {
                    watchlistData.push(this.processWatchlistData(result.data, result.symbol));
                } else {
                    watchlistData.push(this.processWatchlistData(this.getFallbackQuote(result.symbol), result.symbol));
                }
            });

            console.log(`Successfully fetched data for ${stocksData.length} stocks and ${watchlistData.length} watchlist items`);
            
            // Update global variables
            window.stocksData = stocksData;
            window.watchlistData = watchlistData;
            
            // Update UI if functions are called
            if (typeof loadDashboardContent === 'function') {
                loadDashboardContent();
            }
            if (typeof loadPortfolioChart === 'function') {
                loadPortfolioChart();
            }
            
        } catch (error) {
            console.error('Error fetching script data:', error);
            this.showError('Failed to fetch stock data');
        }
    }

    processStockData(rawData, symbol) {
        try {
            const changePercent = rawData.dp;
            const changeSign = changePercent >= 0 ? '+' : '';
            const changeFormatted = `${changeSign}${changePercent.toFixed(1)}%`;
            
            return {
                symbol: symbol,
                name: this.getCompanyName(symbol),
                change: changeFormatted,
                logo: symbol.toLowerCase(),
                isLive: rawData.c && rawData.d !== undefined
            };
        } catch (error) {
            console.error(`Error processing stock data for ${symbol}:`, error);
            return this.getFallbackStockData(symbol);
        }
    }

    processWatchlistData(rawData, symbol) {
        try {
            const currentPrice = rawData.c;
            const changePercent = rawData.dp;
            const changeSign = changePercent >= 0 ? '+' : '';
            const changeFormatted = `${changeSign}${changePercent.toFixed(2)}%`;
            
            return {
                symbol: symbol,
                name: this.getCompanyName(symbol),
                price: this.formatCurrency(currentPrice),
                change: changeFormatted,
                logo: symbol.toLowerCase(),
                isLive: rawData.c && rawData.d !== undefined
            };
        } catch (error) {
            console.error(`Error processing watchlist data for ${symbol}:`, error);
            return this.getFallbackWatchlistData(symbol);
        }
    }

    getFallbackQuote(symbol) {
        const fallbackPrices = {
            'TSLA': { c: 245.67, d: 5.35, dp: 2.23 },
            'AAPL': { c: 198.85, d: 3.53, dp: 1.81 },
            'NVDA': { c: 875.43, d: 15.22, dp: 1.77 },
            'AMD': { c: 142.18, d: 3.23, dp: 2.32 },
            'META': { c: 485.23, d: 6.56, dp: 1.37 },
            'AMZN': { c: 191.10, d: 2.65, dp: 1.41 },
            'GOOGL': { c: 158.71, d: 2.89, dp: 1.85 },
            'NFLX': { c: 485.32, d: 6.42, dp: 1.34 },
            'SPOT': { c: 555.87, d: 2.32, dp: 0.42 },
            'PFE': { c: 122.49, d: 2.98, dp: 2.49 },
            'LLY': { c: 753.71, d: 3.78, dp: 0.50 },
            'TEAM': { c: 209.62, d: 4.02, dp: 1.96 },
            'TSM': { c: 158.75, d: 12.29, dp: 8.40 }
        };
        
        return fallbackPrices[symbol] || { c: 100, d: 2, dp: 2.04 };
    }

    getFallbackStockData(symbol) {
        const fallback = this.getFallbackQuote(symbol);
        const changeSign = fallback.dp >= 0 ? '+' : '';
        const changeFormatted = `${changeSign}${fallback.dp.toFixed(1)}%`;
        
        return {
            symbol: symbol,
            name: this.getCompanyName(symbol),
            change: changeFormatted,
            logo: symbol.toLowerCase(),
            isLive: false
        };
    }

    getFallbackWatchlistData(symbol) {
        const fallback = this.getFallbackQuote(symbol);
        const changeSign = fallback.dp >= 0 ? '+' : '';
        const changeFormatted = `${changeSign}${fallback.dp.toFixed(2)}%`;
        
        return {
            symbol: symbol,
            name: this.getCompanyName(symbol),
            price: this.formatCurrency(fallback.c),
            change: changeFormatted,
            logo: symbol.toLowerCase(),
            isLive: false
        };
    }

    getCompanyName(symbol) {
        const names = {
            'TSLA': 'Tesla Inc',
            'AAPL': 'Apple Inc',
            'NVDA': 'NVIDIA Corp',
            'AMD': 'AMD Inc',
            'META': 'Meta Platforms',
            'AMZN': 'Amazon.com Inc',
            'GOOGL': 'Alphabet Inc',
            'NFLX': 'Netflix Inc',
            'SPOT': 'Spotify Technology',
            'PFE': 'Pfizer Inc',
            'LLY': 'Eli Lilly and Company',
            'TEAM': 'Atlassian Corporation',
            'TSM': 'Taiwan Semiconductor Manufacturing'
        };
        return names[symbol] || `${symbol} Inc`;
    }

    formatCurrency(amount) {
        if (window.locationService) {
            return window.locationService.formatCurrency(amount);
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        }
    }

    loadCachedData() {
        try {
            const storedStocks = localStorage.getItem('alphawave_script_stocks_cache');
            const storedWatchlist = localStorage.getItem('alphawave_script_watchlist_cache');
            
            if (storedStocks) {
                const cacheData = JSON.parse(storedStocks);
                const stocksData = [];
                
                this.stocksSymbols.forEach(symbol => {
                    const cachedQuote = cacheData[symbol];
                    if (cachedQuote) {
                        stocksData.push(this.processStockData(cachedQuote, symbol));
                    } else {
                        stocksData.push(this.getFallbackStockData(symbol));
                    }
                });
                
                window.stocksData = stocksData;
                console.log('Loaded cached stocks data');
            }
            
            if (storedWatchlist) {
                const cacheData = JSON.parse(storedWatchlist);
                const watchlistData = [];
                
                this.watchlistSymbols.forEach(symbol => {
                    const cachedQuote = cacheData[symbol];
                    if (cachedQuote) {
                        watchlistData.push(this.processWatchlistData(cachedQuote, symbol));
                    } else {
                        watchlistData.push(this.getFallbackWatchlistData(symbol));
                    }
                });
                
                window.watchlistData = watchlistData;
                console.log('Loaded cached watchlist data');
            }
        } catch (error) {
            console.warn('Could not load cached data:', error);
        }
    }

    saveCacheToStorage() {
        try {
            // Save stocks cache
            const stocksCacheData = {};
            if (window.stocksData) {
                window.stocksData.forEach(stock => {
                    const fallback = this.getFallbackQuote(stock.symbol);
                    stocksCacheData[stock.symbol] = {
                        c: fallback.c,
                        d: fallback.d,
                        dp: fallback.dp
                    };
                });
                localStorage.setItem('alphawave_script_stocks_cache', JSON.stringify(stocksCacheData));
            }
            
            // Save watchlist cache
            const watchlistCacheData = {};
            if (window.watchlistData) {
                window.watchlistData.forEach(stock => {
                    const fallback = this.getFallbackQuote(stock.symbol);
                    watchlistCacheData[stock.symbol] = {
                        c: fallback.c,
                        d: fallback.d,
                        dp: fallback.dp
                    };
                });
                localStorage.setItem('alphawave_script_watchlist_cache', JSON.stringify(watchlistCacheData));
            }
        } catch (error) {
            console.warn('Could not save cache to storage:', error);
        }
    }

    showError(message) {
        console.error('Script API Error:', message);
    }

    refreshData() {
        this.fetchAllScriptData();
    }
}
// --- END: Script.js API Integration ---

// Initialize Script API
const scriptAPI = new ScriptAPI();

// Sample data (now populated by API)
let stocksData = [];
let watchlistData = [];

const newsData = [
    {
        title: 'Federal Reserve Signals Rate Changes',
        source: 'Bloomberg',
        time: '2h ago',
        category: 'Top Story'
    },
    {
        title: 'Tech Sector Leads Market Rally',
        source: 'Reuters',
        time: '4h ago',
        category: 'Markets'
    },
    {
        title: 'Investment Strategies for Market Volatility',
        source: 'MarketWatch',
        time: '5h ago',
        category: 'Sponsored'
    },
    {
        title: 'Global Markets React to Asian Trading Updates',
        source: 'CNBC',
        time: '6h ago',
        category: 'Global'
    }
];

const stockNewsData = [
    {
        title: "Google's Hidden Trillion-Dollar Opportunity in AI",
        source: 'Nasdaq',
        time: '22 mins ago'
    },
    {
        title: "2 Dirt Cheap Stocks Investors Can't Afford to Miss Out on During the Stock Market Chaos",
        source: 'Reuters',
        time: '36 mins ago'
    },
    {
        title: "Trump's tariff exemptions boost Magnificent Seven stocks",
        source: 'Investing.com',
        time: '2 hours ago'
    }
];

let portfolioChart = null;
let stockChart = null;
let incomeChart = null;

// Load dashboard content
function loadDashboardContent() {
    // Load My Stocks
    const myStocksGrid = document.getElementById('myStocksGrid');
    if (myStocksGrid) {
        myStocksGrid.innerHTML = stocksData.map(stock => `
            <div class="stock-card" onclick="showStockDetail('${stock.symbol}')">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-change positive">${stock.change}</div>
            </div>
        `).join('');
    }

    // Load Watchlist
    const watchlistGrid = document.getElementById('watchlistGrid');
    if (watchlistGrid) {
        watchlistGrid.innerHTML = stocksData.map(stock => `
            <div class="stock-card">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-change positive">${stock.change}</div>
            </div>
        `).join('');
    }

    // Load Trending
    const trendingGrid = document.getElementById('trendingGrid');
    if (trendingGrid) {
        trendingGrid.innerHTML = stocksData.map(stock => `
            <div class="stock-card">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-change positive">${stock.change}</div>
            </div>
        `).join('');
    }

    // Load News
    const newsContainer = document.getElementById('newsContainer');
    if (newsContainer) {
        newsContainer.innerHTML = newsData.slice(0, 3).map(news => `
            <div class="news-item">
                <div class="news-content">
                    <h5>${news.title}</h5>
                    <div class="news-meta">${news.source} • ${news.time} • ${news.category}</div>
                </div>
            </div>
        `).join('');
    }
}

// Load portfolio chart
function loadPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    if (portfolioChart) {
        portfolioChart.destroy();
    }
    
    portfolioChart = new Chart(context, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Portfolio Value',
                data: [48000, 38000, 50000, 47000, 49000, 47892],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value >= 1000 ? (value/1000) + 'K' : value;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            }
        }
    });

    // Load portfolio stocks
    const portfolioStocksGrid = document.getElementById('portfolioStocksGrid');
    if (portfolioStocksGrid) {
        portfolioStocksGrid.innerHTML = stocksData.map(stock => `
            <div class="stock-card" onclick="showStockDetail('${stock.symbol}')">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-change positive">${stock.change}</div>
            </div>
        `).join('');
    }
}

// Load stock detail chart
function loadStockDetailChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    if (stockChart) {
        stockChart.destroy();
    }
    
    //generate stock price data
    const generatePriceData = () => {
        const data = [];
        let price = 245;
        for (let i = 0; i < 30; i++) {
            price += (Math.random() - 0.5) * 10;
            data.push(Math.max(price, 220));
        }
        return data;
    };
    
    stockChart = new Chart(context, {
        type: 'line',
        data: {
            labels: Array.from({length: 30}, (_, i) => i + 1),
            datasets: [{
                label: 'Price',
                data: generatePriceData(),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            }
        }
    });
}

// Load income chart
function loadIncomeChart() {
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: ['4Q2023', '1Q2024', '2Q2024', '3Q2024', '4Q2024'],
            datasets: [{
                label: 'Total Revenue',
                data: [85000, 80000, 75000, 88000, 82000],
                backgroundColor: '#333',
                borderRadius: 5
            }, {
                label: 'Net Income',
                data: [20000, 18000, 16000, 22000, 19000],
                backgroundColor: '#ccc',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#666',
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            }
        }
    });
}

// Load stock news
function loadStockNews() {
    const container = document.getElementById('stockNewsContainer');
    if (container) {
        container.innerHTML = stockNewsData.map(news => `
            <div class="news-item">
                <div class="news-content">
                    <h5>${news.title}</h5>
                    <div class="news-meta">${news.source} • ${news.time}</div>
                </div>
            </div>
        `).join('');
    }
}

// Load watchlist page
function loadWatchlistPage() {
    const container = document.getElementById('watchlistContainer');
    if (container) {
        container.innerHTML = watchlistData.map(stock => `
            <div class="stock-list-item" onclick="showStockDetail('${stock.symbol}')">
                <div class="stock-logo ${stock.logo}">
                    ${getStockIcon(stock.symbol)}
                </div>
                <div class="stock-info">
                    <h5>${stock.symbol}</h5>
                    <p>${stock.name}</p>
                </div>
                <div class="stock-price">
                    <div class="price">${stock.price}</div>
                    <div class="change positive">${stock.change}</div>
                </div>
            </div>
        `).join('');
    }
}

// Load stocks page
function loadStocksPage() {
    const container = document.getElementById('stocksContainer');
    if (container) {
        container.innerHTML = watchlistData.map(stock => `
            <div class="stock-list-item" onclick="showStockDetail('${stock.symbol}')">
                <div class="stock-logo ${stock.logo}">
                    ${getStockIcon(stock.symbol)}
                </div>
                <div class="stock-info">
                    <h5>${stock.symbol}</h5>
                    <p>${stock.name}</p>
                </div>
                <div class="stock-price">
                    <div class="price">${stock.price}</div>
                    <div class="change positive">${stock.change}</div>
                </div>
            </div>
        `).join('');
    }
}

// Load news page
function loadNewsPage() {
    // Load trending stocks for news page
    const newsTrendingGrid = document.getElementById('newsTrendingGrid');
    if (newsTrendingGrid) {
        newsTrendingGrid.innerHTML = stocksData.map(stock => `
            <div class="stock-card">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-change positive">${stock.change}</div>
            </div>
        `).join('');
    }

    // Load all news
    const allNewsContainer = document.getElementById('allNewsContainer');
    if (allNewsContainer) {
        allNewsContainer.innerHTML = newsData.map(news => `
            <div class="news-item">
                <div class="news-content">
                    <h5>${news.title}</h5>
                    <div class="news-meta">${news.source} • ${news.time} • ${news.category}</div>
                </div>
            </div>
        `).join('');
    }
}

// Get stock icon
function getStockIcon(symbol) {
    const icons = {
        'AAPL': 'A',
        'GOOGL': 'G',
        'TSLA': 'T',
        'AMZN': 'a',
        'NFLX': 'N',
        'META': 'f',
        'NVDA': 'N',
        'AMD': 'AMD'
    };
    return icons[symbol] || symbol.charAt(0);
}

// Show stock detail
function showStockDetail(symbol) {
    window.location.href = `stock-detail.html?symbol=${symbol}`;
}

// Update time selection
function updateTimeSelection(button, period) {
    // Remove active class from all buttons in the same container
    const container = button.parentElement;
    const buttons = container.querySelectorAll('.time-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Update chart based on period (you can implement specific logic here)
    console.log('Time period changed to:', period);
}

// User location detection
function detectUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log('User location:', lat, lon);
            // Use location to determine relevant market
        });
    }
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) return;
            
            const filteredStocks = stocksData.filter(stock => 
                stock.symbol.toLowerCase().includes(query) ||
                stock.name.toLowerCase().includes(query)
            );
            
            console.log('Search results:', filteredStocks);
            // You can implement dropdown search results here
        });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    detectUserLocation();
    initializeSearch();
    
    // Load content based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'dashboard.html':
        case '':
            loadDashboardContent();
            break;
        case 'portfolio.html':
            loadPortfolioChart();
            break;
        case 'news.html':
            loadNewsPage();
            break;
        case 'watchlist.html':
            loadWatchlistPage();
            break;
        case 'stocks.html':
            loadStocksPage();
            break;
        case 'stock-detail.html':
            loadStockDetailChart();
            loadIncomeChart();
            loadStockNews();
            break;
    }
});

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Add mobile menu styles if needed
if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        .sidebar.mobile-open {
            transform: translateX(0);
        }
        .mobile-menu-btn {
            display: block;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            margin-right: 15px;
        }
        @media (min-width: 769px) {
            .mobile-menu-btn {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
}