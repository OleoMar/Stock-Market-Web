// Sample data 
const stocksData = [
    { symbol: 'TSLA', name: 'Tesla Inc', change: '+8.4%', logo: 'tsla' },
    { symbol: 'AAPL', name: 'Apple Inc', change: '+3.2%', logo: 'aapl' },
    { symbol: 'NVDA', name: 'NVIDIA Corp', change: '+5.1%', logo: 'nvda' },
    { symbol: 'AMD', name: 'AMD Inc', change: '+4.8%', logo: 'amd' },
    { symbol: 'META', name: 'Meta Platforms', change: '+8.4%', logo: 'meta' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', change: '+3.2%', logo: 'amzn' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', change: '+5.1%', logo: 'googl' },
    { symbol: 'NFLX', name: 'Netflix Inc', change: '+4.8%', logo: 'nflx' }
];

const watchlistData = [
    { symbol: 'AAPL', name: 'Apple Inc', price: '198.85', change: '+13.33%', logo: 'aapl' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: '158.71', change: '+9.68%', logo: 'googl' },
    { symbol: 'TSLA', name: 'Tesla Inc', price: '272.20', change: '+22.69%', logo: 'tsla' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', price: '191.10', change: '+11.98%', logo: 'amzn' },
    { symbol: 'NFLX', name: 'Netflix Inc', price: '945.47', change: '+8.62%', logo: 'nflx' },
    { symbol: 'SPOT', name: 'Microsoft Corp', price: '555.87', change: '+2.32%', logo: 'meta' },
    { symbol: 'PFE', name: 'Pfizer Inc', price: '122.49', change: '+2.98%', logo: 'nvda' },
    { symbol: 'LLY', name: 'Eli Lilly and Company', price: '753.71', change: '+3.78%', logo: 'amd' },
    { symbol: 'TEAM', name: 'Atlassian Corporation', price: '209.62', change: '+4.02%', logo: 'aapl' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor Manu', price: '158.75', change: '+12.29%', logo: 'tsla' }
];

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
        'AAPL': '🍎',
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