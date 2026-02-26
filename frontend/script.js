// ============================================
// UNIPAY PRO - COMPLETE MAIN JAVASCRIPT
// All application logic
// ============================================

// ===== CONFIGURATION =====
const CONFIG = {
    API_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return 'https://unipay-pro-api.onrender.com/api';
    })(),
    
    SOCKET_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        return 'https://unipay-pro-api.onrender.com';
    })()
};

// ===== STATE MANAGEMENT =====
let currentUser = null;
let socket = null;
let transactions = [];
let notifications = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            redirectToLogin();
            return;
        }
        
        await loadUserData();
        initializeSocket();
        
        const page = getCurrentPage();
        await loadPageData(page);
        
    } catch (error) {
        console.error('Initialization error:', error);
        
        if (error.message.includes('401')) {
            handleAuthError();
        } else {
            showToast('Failed to load app', 'error');
        }
    } finally {
        showLoading(false);
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop().split('.')[0] || 'index';
}

async function loadPageData(page) {
    switch(page) {
        case 'index':
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'transactions':
            await loadAllTransactions();
            break;
        case 'profile':
            await loadProfileData();
            break;
        case 'global-send':
            await loadCountries();
            break;
        case 'track':
            await loadTransactionDetails();
            break;
    }
}

// ===== USER DATA =====
async function loadUserData() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load user');
        
        currentUser = await response.json();
        updateUserUI();
        return currentUser;
        
    } catch (error) {
        console.error('Error loading user:', error);
        throw error;
    }
}

function updateUserUI() {
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = currentUser?.fullName || 'User';
    });
    
    if (currentUser?.balances) {
        updateBalanceDisplay('USD', currentUser.balances.USD);
        updateBalanceDisplay('EUR', currentUser.balances.EUR);
        updateBalanceDisplay('GBP', currentUser.balances.GBP);
        updateBalanceDisplay('KES', currentUser.balances.KES);
    }
}

function updateBalanceDisplay(currency, amount) {
    const elements = document.querySelectorAll(`[data-balance="${currency.toLowerCase()}"]`);
    elements.forEach(el => {
        el.textContent = formatCurrency(amount, currency);
    });
}

// ===== AUTHENTICATION =====
function handleAuthError() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectToLogin();
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function logout() {
    if (socket) socket.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// ===== SOCKET.IO =====
function initializeSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    socket = io(CONFIG.SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('authenticate', token);
    });
    
    socket.on('transaction', handleNewTransaction);
    socket.on('notification', handleNewNotification);
    socket.on('balance-update', handleBalanceUpdate);
}

function handleNewTransaction(data) {
    transactions.unshift(data.transaction);
    showToast(`New transaction: ${formatCurrency(data.transaction.amount)}`, 'info');
    
    const page = getCurrentPage();
    if (page === 'index' || page === 'transactions') {
        loadPageData(page);
    }
}

function handleNewNotification(notification) {
    notifications.unshift(notification);
    updateNotificationBadge();
    showToast(notification.message, 'info');
}

function handleBalanceUpdate(data) {
    if (currentUser) {
        currentUser.balances = data.balances;
        updateUserUI();
    }
}

// ===== DASHBOARD =====
async function loadDashboardData() {
    await loadRecentTransactions();
    await loadNotifications();
}

async function loadRecentTransactions() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/payments/transactions?limit=5`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load transactions');
        
        const data = await response.json();
        transactions = data.transactions;
        renderTransactions(transactions, 'recent');
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// ===== TRANSACTIONS =====
async function loadAllTransactions() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/payments/transactions`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load transactions');
        
        const data = await response.json();
        transactions = data.transactions;
        renderTransactions(transactions, 'all');
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Failed to load transactions', 'error');
    }
}

function renderTransactions(transactions, type = 'all') {
    const container = document.getElementById('transactions-list');
    if (!container) return;
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exchange-alt"></i>
                <h3>No transactions yet</h3>
                <p>Send money to get started</p>
                <button class="btn btn-primary" onclick="window.location.href='send.html'">
                    Send Money
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    const displayTransactions = type === 'recent' ? transactions.slice(0, 5) : transactions;
    
    displayTransactions.forEach(t => {
        const isReceived = t.type === 'receive';
        const iconClass = getTransactionIcon(t.type);
        const iconBgClass = `icon-${t.type}`;
        
        html += `
            <div class="transaction-item" onclick="viewTransaction('${t.transactionId || t._id}')">
                <div class="transaction-icon ${iconBgClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${getTransactionTitle(t)}</div>
                    <div class="transaction-meta">
                        <span>${formatDate(t.createdAt)}</span>
                        <span class="badge badge-${t.status}">${t.status}</span>
                    </div>
                </div>
                <div class="transaction-amount ${isReceived ? 'amount-positive' : 'amount-negative'}">
                    ${isReceived ? '+' : '-'} ${formatCurrency(t.amount, t.currency)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTransactionIcon(type) {
    const icons = {
        'send': 'fas fa-paper-plane',
        'receive': 'fas fa-download',
        'deposit': 'fas fa-plus-circle',
        'withdraw': 'fas fa-credit-card',
        'exchange': 'fas fa-exchange-alt'
    };
    return icons[type] || 'fas fa-exchange-alt';
}

function getTransactionTitle(transaction) {
    switch(transaction.type) {
        case 'send':
            return `Sent to ${transaction.recipientName || transaction.recipientEmail || 'someone'}`;
        case 'receive':
            return `Received from ${transaction.senderName || transaction.senderEmail || 'someone'}`;
        case 'deposit':
            return `Deposit via ${transaction.paymentMethod?.type || 'bank'}`;
        case 'withdraw':
            return `Withdrawal to ${transaction.paymentMethod?.type || 'bank'}`;
        case 'exchange':
            return `Exchanged ${transaction.fromCurrency} to ${transaction.toCurrency}`;
        default:
            return 'Transaction';
    }
}

// ===== NOTIFICATIONS =====
async function loadNotifications() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/users/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load notifications');
        
        notifications = await response.json();
        updateNotificationBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    document.querySelectorAll('.notification-badge').forEach(badge => {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    });
}

// ===== PROFILE =====
async function loadProfileData() {
    try {
        await loadUserData();
        populateProfileForm();
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateProfileForm() {
    if (!currentUser) return;
    
    const fields = {
        'fullName': currentUser.fullName,
        'email': currentUser.email,
        'phoneNumber': currentUser.phoneNumber,
        'country': currentUser.country
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    });
}

// ===== COUNTRIES =====
async function loadCountries() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/global/countries`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load countries');
        
        const data = await response.json();
        populateCountrySelectors(data.countries);
        
    } catch (error) {
        console.error('Error loading countries:', error);
        showToast('Failed to load countries', 'error');
    }
}

function populateCountrySelectors(countries) {
    const fromSelect = document.getElementById('fromCountry');
    const toSelect = document.getElementById('toCountry');
    
    if (!fromSelect || !toSelect) return;
    
    let options = '<option value="">Select country</option>';
    
    countries.forEach(c => {
        options += `<option value="${c.code}">${c.name} (${c.currency})</option>`;
    });
    
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
}

// ===== TRANSACTION DETAILS =====
async function loadTransactionDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        showToast('No transaction ID provided', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/global/transaction/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load transaction');
        
        const data = await response.json();
        renderTransactionDetails(data.transaction);
        
    } catch (error) {
        console.error('Error loading transaction:', error);
        showToast('Failed to load transaction details', 'error');
    }
}

function renderTransactionDetails(transaction) {
    const container = document.getElementById('transaction-details');
    if (!container) return;
    
    document.getElementById('transaction-id').textContent = transaction.transactionId;
    document.getElementById('transaction-status').textContent = transaction.status;
    document.getElementById('transaction-status').className = `badge badge-${transaction.status}`;
    
    document.getElementById('amount-sent').textContent = formatCurrency(transaction.amount, transaction.currency);
    document.getElementById('amount-received').textContent = formatCurrency(transaction.targetAmount, transaction.targetCurrency);
    document.getElementById('exchange-rate').textContent = `1 ${transaction.currency} = ${transaction.exchangeRate} ${transaction.targetCurrency}`;
    document.getElementById('transaction-fee').textContent = formatCurrency(transaction.fees.total, transaction.currency);
    document.getElementById('payment-method').textContent = transaction.paymentMethod?.type || 'Bank Transfer';
    document.getElementById('transaction-date').textContent = new Date(transaction.createdAt).toLocaleString();
    
    if (transaction.tracking && transaction.tracking.length > 0) {
        renderTrackingTimeline(transaction.tracking);
    }
}

function renderTrackingTimeline(tracking) {
    const container = document.getElementById('tracking-timeline');
    if (!container) return;
    
    let html = '';
    
    tracking.forEach(item => {
        html += `
            <div class="timeline-item">
                <div class="timeline-icon">
                    <i class="fas ${getTrackingIcon(item.status)}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-status">${item.status}</div>
                    <div class="timeline-time">${new Date(item.timestamp).toLocaleString()}</div>
                    ${item.location ? `<div class="timeline-location">${item.location}</div>` : ''}
                    ${item.note ? `<div class="timeline-note">${item.note}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTrackingIcon(status) {
    const icons = {
        'initiated': 'fa-rocket',
        'processing': 'fa-cog',
        'completed': 'fa-check-circle',
        'failed': 'fa-times-circle',
        'cancelled': 'fa-ban'
    };
    return icons[status] || 'fa-circle';
}

// ===== UTILITIES =====
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(show) {
    const loader = document.getElementById('global-loader');
    if (!loader) return;
    loader.style.display = show ? 'flex' : 'none';
}

function viewTransaction(id) {
    window.location.href = `track.html?id=${id}`;
}

function goBack() {
    window.history.back();
}

// ===== MODAL FUNCTIONS =====
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// ===== EXPOSE GLOBALLY =====
window.UnipayPro = {
    logout,
    showToast,
    formatCurrency,
    formatDate,
    openModal,
    closeModal,
    goBack,
    viewTransaction
};