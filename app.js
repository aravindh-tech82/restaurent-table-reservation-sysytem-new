// app.js - Core controller, routing, page view manager & logic

// State Management for active booking wizard
let bookingState = {
  restaurantId: 'luxe-1', // single luxury restaurant simulation
  date: '',
  timeSlot: '',
  guests: 2,
  seatingArea: 'indoor',
  selectedTableId: null,
  tableName: ''
};

// Global Notifications Utility
window.showNotification = function(message, type = 'info') {
  const alertBanner = document.getElementById('global-alert-banner');
  if (!alertBanner) return;

  alertBanner.className = `alert-banner active ${type}`;
  
  // Icon based on type
  let iconHtml = '';
  if (type === 'success') iconHtml = '<i class="lucide-check-circle-2">✓</i>';
  else if (type === 'error') iconHtml = '<i class="lucide-alert-circle">✗</i>';
  else iconHtml = '<i class="lucide-info">ℹ</i>';

  alertBanner.innerHTML = `${iconHtml} <span>${message}</span>`;

  setTimeout(() => {
    alertBanner.classList.remove('active');
  }, 3500);
};

// DOM Content Loaded Initialize
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial Seeding of Database
  db.init();

  // 2. Setup theme switcher
  setupTheme();

  // 3. Routing Init
  handleRouting();
  window.addEventListener('hashchange', handleRouting);

  // 4. Handle Splash Screen transition
  const splash = document.getElementById('page-splash');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
      // After transition finishes, remove from flow
      setTimeout(() => splash.style.display = 'none', 600);
    }, 2200);
  }

  // 5. Global Form Event Listeners
  setupFormListeners();

  // 6. AI Chatbot UI setup
  setupChatbotUI();
});

// Theme setup (Dark by default, toggles light)
function setupTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  const savedTheme = localStorage.getItem('luxe_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    toggleBtn.innerHTML = '🌙'; // moon to switch back to dark
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('luxe_theme', isLight ? 'light' : 'dark');
    toggleBtn.innerHTML = isLight ? '🌙' : '☀️';
    
    // Refresh charts if we are on dashboard page
    if (window.location.hash.startsWith('#admin-reports')) {
      initReportsPage();
    }
  });
}

// Client Side Router
function handleRouting() {
  const hash = window.location.hash || '#welcome';
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Clean up any 3D environment when leaving seating layout
  if (hash !== '#table-layout') {
    threeDLayout.destroy();
  }

  // Find target page element
  let targetPageId = hash.replace('#', 'page-');
  let targetPage = document.getElementById(targetPageId);
  
  if (!targetPage) {
    targetPage = document.getElementById('page-welcome');
  }

  // Role-Based Route Guarding
  const currentUser = db.getCurrentUser();
  const isAdminRoute = hash.startsWith('#admin') || hash === '#manage-tables' || hash === '#manage-reservations' || hash === '#customer-management' || hash === '#reports';
  const isCustomerRoute = hash === '#my-reservations' || hash === '#profile' || hash === '#table-reservation' || hash === '#table-layout' || hash === '#confirmation' || hash === '#payment' || hash === '#success';

  if (isAdminRoute) {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Staff')) {
      window.showNotification('Access denied. Admin or Staff privileges required.', 'error');
      window.location.hash = '#login';
      return;
    }
  }

  if (isCustomerRoute) {
    if (!currentUser) {
      window.showNotification('Please log in to continue.', 'error');
      window.location.hash = '#login';
      return;
    }
  }

  // Deactivate all pages and activate target
  pages.forEach(p => p.classList.remove('active'));
  targetPage.classList.add('active');

  // Update navigation link highlights
  navLinks.forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Header display details
  updateHeaderNav(currentUser);

  // Initialize specific page contents
  initializePage(hash);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Nav bar buttons based on role
function updateHeaderNav(user) {
  const guestNav = document.getElementById('nav-guest-links');
  const customerNav = document.getElementById('nav-customer-links');
  const adminNav = document.getElementById('nav-admin-links');
  const userBadge = document.getElementById('nav-user-badge');

  if (guestNav) guestNav.style.display = 'none';
  if (customerNav) customerNav.style.display = 'none';
  if (adminNav) adminNav.style.display = 'none';
  if (userBadge) userBadge.style.display = 'none';

  if (!user) {
    if (guestNav) guestNav.style.display = 'flex';
  } else {
    if (userBadge) {
      userBadge.style.display = 'flex';
      userBadge.querySelector('.user-name').textContent = user.name;
      userBadge.querySelector('.user-role').textContent = `(${user.role})`;
    }
    
    if (user.role === 'Admin' || user.role === 'Staff') {
      if (adminNav) adminNav.style.display = 'flex';
    } else {
      if (customerNav) customerNav.style.display = 'flex';
    }
  }
}

// Router Initializer Hooks
function initializePage(hash) {
  const user = db.getCurrentUser();

  switch(hash) {
    case '#welcome':
      // Render landing reviews/banner
      initWelcomePage();
      break;
    case '#home':
      initHomePage();
      break;
    case '#restaurant-details':
      initDetailsPage();
      break;
    case '#table-reservation':
      initReservationSetupPage();
      break;
    case '#table-layout':
      initTable3DLayoutPage();
      break;
    case '#confirmation':
      initConfirmationPage();
      break;
    case '#success':
      initSuccessPage();
      break;
    case '#my-reservations':
      initMyReservationsPage();
      break;
    case '#profile':
      initProfilePage();
      break;
    // Admin routes
    case '#admin-dashboard':
      initAdminDashboard();
      break;
    case '#manage-tables':
      initManageTablesPage();
      break;
    case '#manage-reservations':
      initManageReservationsPage();
      break;
    case '#customer-management':
      initCustomerManagementPage();
      break;
    case '#reports':
      initReportsPage();
      break;
  }
}

// Page Initializers

function initWelcomePage() {
  const reviewsList = document.getElementById('welcome-reviews-list');
  if (reviewsList) {
    const reviews = db.getReviews();
    reviewsList.innerHTML = reviews.slice(0, 3).map(r => `
      <div class="card review-item">
        <div class="review-header">
          <span class="review-user">${r.userName}</span>
          <span style="color: var(--gold-primary); font-weight: bold;">${'★'.repeat(r.rating)}</span>
        </div>
        <p class="review-comment">"${r.comment}"</p>
      </div>
    `).join('');
  }
}

function initHomePage() {
  // Populate menu/featured if needed
  const container = document.getElementById('featured-list');
  if (container) {
    container.innerHTML = `
      <div class="card restaurant-card" onclick="window.location.hash='#restaurant-details'">
        <img src="assets/banner.jpg" class="restaurant-img" alt="Luxe Dining banner">
        <div class="restaurant-info">
          <div class="restaurant-name">Luxe Dining Restaurant</div>
          <div class="restaurant-meta">
            <span class="rating-badge">★ 4.9</span>
            <span>$$$$</span>
            <span>Gourmet Cuisine</span>
          </div>
          <p class="restaurant-desc">Experience fine Michelin-starred gastronomy blended with modern interactive 3D table selection and impeccable tableside service.</p>
          <div class="card-footer">
            <span style="color: var(--gold-primary); font-weight: 500;">Open Today: 12 PM - 11 PM</span>
            <button class="btn btn-primary btn-sm">Explore Menu</button>
          </div>
        </div>
      </div>
    `;
  }
}

function initDetailsPage() {
  // Populate reviews
  const reviewsContainer = document.getElementById('details-reviews-list');
  if (reviewsContainer) {
    const reviews = db.getReviews();
    reviewsContainer.innerHTML = reviews.map(r => `
      <div class="review-item">
        <div class="review-header">
          <span class="review-user">${r.userName}</span>
          <span style="color: var(--gold-primary); font-size: 0.9rem;">${'★'.repeat(r.rating)}</span>
        </div>
        <p class="review-comment">${r.comment}</p>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${r.date}</span>
      </div>
    `).join('');
  }
}

function initReservationSetupPage() {
  // Setup default date to tomorrow
  const dateInput = document.getElementById('booking-date');
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Setup peak warning indicators on time/date change
  const checkPeakTime = () => {
    const dateVal = dateInput.value;
    const slotVal = document.querySelector('.time-slot-btn.selected')?.dataset.slot;
    const warningDiv = document.getElementById('peak-warning-container');
    
    if (dateVal && slotVal && warningDiv) {
      const prob = chatbot.getPeakTimeProbability(dateVal, slotVal);
      if (prob >= 75) {
        warningDiv.style.display = 'block';
        warningDiv.querySelector('.peak-pct').textContent = `${prob}%`;
        warningDiv.querySelector('.peak-desc').textContent = 'Highly booked peak hour! We suggest VIP table selection or earlier slots for optimal experience.';
      } else {
        warningDiv.style.display = 'none';
      }
    }
  };

  // Time slot buttons binding
  const slotButtons = document.querySelectorAll('.time-slot-btn');
  slotButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      slotButtons.forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      bookingState.timeSlot = e.target.dataset.slot;
      checkPeakTime();
    });
  });

  // Seating options binding
  const seatOptions = document.querySelectorAll('.seating-option');
  seatOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      const target = e.currentTarget;
      seatOptions.forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      bookingState.seatingArea = target.dataset.area;
    });
  });

  dateInput.addEventListener('change', checkPeakTime);
}

function initTable3DLayoutPage() {
  // Pull configuration state
  const dateInput = document.getElementById('booking-date');
  const guestsInput = document.getElementById('booking-guests');
  const slotSelected = document.querySelector('.time-slot-btn.selected');

  if (!dateInput || !slotSelected) {
    window.showNotification('Please fill in booking details first.', 'error');
    window.location.hash = '#table-reservation';
    return;
  }

  bookingState.date = dateInput.value;
  bookingState.guests = parseInt(guestsInput.value);
  bookingState.timeSlot = slotSelected.dataset.slot;

  // Render info header
  document.getElementById('layout-info-header').textContent = `Tables for ${bookingState.date} @ ${bookingState.timeSlot} (${bookingState.seatingArea.toUpperCase()})`;

  // Reset side details panel
  const sidePanel = document.getElementById('layout-selection-details');
  const reserveBtn = document.getElementById('layout-reserve-submit');
  if (sidePanel) {
    sidePanel.innerHTML = `<div class="text-center var-muted">Please click an available table in the 3D map to select.</div>`;
  }
  if (reserveBtn) reserveBtn.disabled = true;

  // Initialize Three.js Layout
  threeDLayout.init('three-d-canvas-container', (tableId) => {
    // Callback when table clicked
    const tables = db.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      bookingState.selectedTableId = table.id;
      bookingState.tableName = table.name;

      if (sidePanel) {
        sidePanel.innerHTML = `
          <span class="table-badge-large">${table.name}</span>
          <div class="sidebar-row mt-4"><span>Category:</span> <strong>${table.category}</strong></div>
          <div class="sidebar-row"><span>Max Capacity:</span> <strong>${table.capacity} guests</strong></div>
          <div class="sidebar-row"><span>Area:</span> <strong>${table.area.toUpperCase()}</strong></div>
          <div class="sidebar-row"><span>Occasion Match:</span> <strong style="color: var(--gold-primary);">High Fidelity</strong></div>
          
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px; line-height:1.5;">
            ${bookingState.guests > table.capacity 
              ? `<span style="color: var(--accent-red);">⚠ Group size exceeds table capacity!</span>` 
              : `✓ Perfect match for your group of ${bookingState.guests}.`}
          </div>
        `;
      }
      
      if (reserveBtn) {
        // Only disable if guests exceed table capacity
        reserveBtn.disabled = bookingState.guests > table.capacity;
      }
    }
  });

  // Render/Update tables status based on selected slot
  threeDLayout.update(bookingState.date, bookingState.timeSlot);
}

function initConfirmationPage() {
  const user = db.getCurrentUser();
  if (!user || !bookingState.selectedTableId) {
    window.location.hash = '#home';
    return;
  }

  document.getElementById('conf-name').textContent = user.name;
  document.getElementById('conf-email').textContent = user.email;
  document.getElementById('conf-phone').textContent = user.phone;
  document.getElementById('conf-date').textContent = bookingState.date;
  document.getElementById('conf-slot').textContent = bookingState.timeSlot;
  document.getElementById('conf-guests').textContent = bookingState.guests;
  document.getElementById('conf-table').textContent = bookingState.tableName;
  document.getElementById('conf-area').textContent = bookingState.seatingArea.toUpperCase();
}

function initSuccessPage() {
  // Simply verify we have a booking id
  const recentBookingId = localStorage.getItem('luxe_recent_booking_id') || 'RES-9999';
  document.getElementById('success-booking-id').textContent = recentBookingId;
}

function initMyReservationsPage() {
  const user = db.getCurrentUser();
  const listContainer = document.getElementById('reservations-list');
  if (!listContainer || !user) return;

  const reservations = db.getReservations().filter(r => r.userId === user.id);

  if (reservations.length === 0) {
    listContainer.innerHTML = `<div class="card text-center text-muted">You have no active or past bookings.</div>`;
    return;
  }

  // Sort reservations: upcoming first, then status, then date descending
  reservations.sort((a,b) => new Date(b.date + 'T' + b.timeSlot) - new Date(a.date + 'T' + a.timeSlot));

  const today = new Date().toISOString().split('T')[0];

  listContainer.innerHTML = reservations.map(res => {
    const isUpcoming = res.date >= today && res.status !== 'Cancelled';
    const hasFeedback = !!res.feedback;

    let actionsHtml = '';
    if (isUpcoming) {
      actionsHtml = `<button class="btn btn-danger btn-sm" onclick="cancelBookingDirect('${res.id}')">Cancel Booking</button>`;
    } else if (res.status === 'Approved' && !hasFeedback) {
      actionsHtml = `
        <div class="feedback-form-compact mt-4">
          <p style="font-size: 0.85rem; font-weight: 500; margin-bottom: 6px;">Leave Dining Feedback:</p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <select id="feed-rate-${res.id}" class="input-control" style="width: 80px; padding: 4px 8px;">
              <option value="5">5 ★</option>
              <option value="4">4 ★</option>
              <option value="3">3 ★</option>
              <option value="2">2 ★</option>
              <option value="1">1 ★</option>
            </select>
            <input type="text" id="feed-comm-${res.id}" placeholder="Your comment" class="input-control" style="flex: 1; padding: 4px 10px; font-size: 0.85rem;">
            <button class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.85rem;" onclick="submitFeedbackDirect('${res.id}')">Submit</button>
          </div>
        </div>
      `;
    } else if (hasFeedback) {
      actionsHtml = `
        <div class="mt-4" style="font-size: 0.85rem; border-top: 1px dashed var(--border-glass); padding-top: 10px;">
          <span style="color: var(--gold-primary); font-weight: bold;">Your Review:</span> ${'★'.repeat(res.feedback.rating)} - <span style="font-style: italic; color: var(--text-secondary);">"${res.feedback.comment}"</span>
        </div>
      `;
    }

    return `
      <div class="card booking-card">
        <div class="booking-main-info">
          <span class="booking-id-tag">${res.id}</span>
          <div class="booking-title">${res.tableName} (${res.seatingArea.toUpperCase()})</div>
          <div class="booking-meta-row">
            <span>📅 ${res.date}</span>
            <span>⏰ ${res.timeSlot}</span>
            <span>👥 ${res.guests} Guests</span>
          </div>
        </div>
        <div>
          <span class="status-badge ${res.status}">${res.status}</span>
          <div class="mt-2 text-right">${actionsHtml}</div>
        </div>
      </div>
    `;
  }).join('');
}

function initProfilePage() {
  const user = db.getCurrentUser();
  if (!user) return;

  document.getElementById('prof-name-title').textContent = user.name;
  document.getElementById('prof-email-title').textContent = user.email;
  document.getElementById('prof-avatar-letter').textContent = user.name.charAt(0).toUpperCase();

  // Populate form fields
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-phone').value = user.phone;

  // Run AI Preference text
  const prefBox = document.getElementById('profile-ai-preference');
  if (prefBox) {
    const aiResult = chatbot.getAIResponse('preference', user);
    prefBox.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="font-size: 1.5rem;">🤖</div>
        <div>
          <div style="font-weight: 600; color: var(--gold-primary); font-size: 0.95rem; margin-bottom: 4px;">AI Preference Insights</div>
          <div style="font-size: 0.88rem; line-height:1.5;">${aiResult.response.replace(/\*\*/g, '')}</div>
        </div>
      </div>
    `;
  }
}

// Global cancellation trigger
window.cancelBookingDirect = function(resId) {
  if (confirm(`Are you sure you want to cancel booking ${resId}?`)) {
    const res = db.cancelReservation(resId);
    if (res.success) {
      window.showNotification('Reservation cancelled successfully.', 'success');
      initMyReservationsPage();
    }
  }
};

// Global feedback submit trigger
window.submitFeedbackDirect = function(resId) {
  const rating = document.getElementById(`feed-rate-${resId}`).value;
  const comment = document.getElementById(`feed-comm-${resId}`).value;

  if (!comment) {
    window.showNotification('Please fill in feedback comments.', 'error');
    return;
  }

  const res = db.addFeedback(resId, rating, comment);
  if (res.success) {
    window.showNotification('Thank you for your feedback!', 'success');
    initMyReservationsPage();
  }
};

// ADMIN & STAFF PORTALS INITIALIZERS

function initAdminDashboard() {
  const reservations = db.getReservations();
  const tables = db.getTables();
  const users = db.getUsers();

  const today = new Date().toISOString().split('T')[0];
  const activeToday = reservations.filter(r => r.date === today && r.status === 'Approved');

  // Set Metrics
  document.getElementById('metric-total-bookings').textContent = reservations.length;
  document.getElementById('metric-occupied-tables').textContent = activeToday.length;
  document.getElementById('metric-available-tables').textContent = Math.max(0, tables.length - activeToday.length);
  document.getElementById('metric-total-customers').textContent = users.filter(u => u.role === 'Customer').length;

  // Populate daily overview table
  const todayBody = document.getElementById('admin-today-bookings-body');
  if (todayBody) {
    const todayList = reservations.filter(r => r.date === today);
    if (todayList.length === 0) {
      todayBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No reservations scheduled for today.</td></tr>`;
    } else {
      todayBody.innerHTML = todayList.map(r => `
        <tr>
          <td><strong style="color: var(--gold-primary);">${r.id}</strong></td>
          <td>${r.userName}</td>
          <td>${r.tableName}</td>
          <td>${r.timeSlot}</td>
          <td><span class="status-badge ${r.status}">${r.status}</span></td>
        </tr>
      `).join('');
    }
  }
}

function initManageTablesPage() {
  const tables = db.getTables();
  const tableBody = document.getElementById('admin-tables-body');
  if (!tableBody) return;

  tableBody.innerHTML = tables.map(t => `
    <tr>
      <td><strong>${t.name}</strong></td>
      <td>${t.category}</td>
      <td>${t.capacity} Seats</td>
      <td>${t.area.toUpperCase()}</td>
      <td>X: ${t.x}, Z: ${t.z}</td>
      <td>
        <button class="btn btn-secondary btn-sm mr-2" style="padding: 4px 8px;" onclick="loadTableFormEdit('${t.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" style="padding: 4px 8px;" onclick="deleteTableDirect('${t.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Bind load edit table form values
window.loadTableFormEdit = function(tableId) {
  const tables = db.getTables();
  const table = tables.find(t => t.id === tableId);
  if (!table) return;

  document.getElementById('table-id-hidden').value = table.id;
  document.getElementById('table-name').value = table.name;
  document.getElementById('table-category').value = table.category;
  document.getElementById('table-capacity').value = table.capacity;
  document.getElementById('table-area').value = table.area;
  document.getElementById('table-x-coord').value = table.x;
  document.getElementById('table-z-coord').value = table.z;

  document.getElementById('table-form-submit-btn').textContent = 'Update Table';
  window.showNotification(`Loaded Table ${table.name} details into form.`, 'info');
};

window.deleteTableDirect = function(tableId) {
  if (confirm('Delete this table? This removes it from the 3D layout planner.')) {
    const res = db.deleteTable(tableId);
    if (res.success) {
      window.showNotification('Table deleted successfully.', 'success');
      initManageTablesPage();
    }
  }
};

function initManageReservationsPage() {
  const reservations = db.getReservations();
  const resBody = document.getElementById('admin-reservations-body');
  if (!resBody) return;

  // Render all bookings
  renderReservationAdminList(reservations);

  // Bind Search input
  const searchInput = document.getElementById('admin-res-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = reservations.filter(r => 
        r.id.toLowerCase().includes(q) || 
        r.userName.toLowerCase().includes(q) || 
        r.tableName.toLowerCase().includes(q) ||
        r.date.includes(q)
      );
      renderReservationAdminList(filtered);
    });
  }
}

function renderReservationAdminList(list) {
  const resBody = document.getElementById('admin-reservations-body');
  if (!resBody) return;

  if (list.length === 0) {
    resBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No reservations found.</td></tr>`;
    return;
  }

  // Sort descending by date
  list.sort((a,b) => new Date(b.date + 'T' + b.timeSlot) - new Date(a.date + 'T' + a.timeSlot));

  resBody.innerHTML = list.map(r => {
    let actionButtons = '';
    if (r.status === 'Pending') {
      actionButtons = `
        <button class="btn btn-primary btn-sm mr-2" style="padding: 4px 8px; font-size:0.8rem; background:#10b981;" onclick="updateResStatus('${r.id}', 'Approved')">Approve</button>
        <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size:0.8rem;" onclick="updateResStatus('${r.id}', 'Cancelled')">Cancel</button>
      `;
    } else if (r.status === 'Approved') {
      actionButtons = `
        <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size:0.8rem;" onclick="updateResStatus('${r.id}', 'Cancelled')">Cancel</button>
      `;
    }

    return `
      <tr>
        <td><strong style="color:var(--gold-primary);">${r.id}</strong></td>
        <td>${r.userName}<br><small class="text-muted">${r.userPhone}</small></td>
        <td>${r.tableName}</td>
        <td>${r.date} ${r.timeSlot}</td>
        <td>${r.guests} guests</td>
        <td><span class="status-badge ${r.status}">${r.status}</span></td>
        <td>${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

window.updateResStatus = function(resId, status) {
  const res = db.updateReservationStatus(resId, status);
  if (res.success) {
    window.showNotification(`Reservation ${resId} status updated to ${status}.`, 'success');
    initManageReservationsPage();
    
    // Also notify via browser alert/email simulation
    console.log(`[Notification System] Email sent to client: Your booking ${resId} is now ${status}.`);
  }
};

function initCustomerManagementPage() {
  const users = db.getUsers().filter(u => u.role === 'Customer');
  const custBody = document.getElementById('admin-customers-body');
  if (!custBody) return;

  const reservations = db.getReservations();

  custBody.innerHTML = users.map(u => {
    const custReservations = reservations.filter(r => r.userId === u.id);
    const completedCount = custReservations.filter(r => r.status === 'Approved').length;
    const cancelledCount = custReservations.filter(r => r.status === 'Cancelled').length;

    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${custReservations.length} bookings (${completedCount} Approved, ${cancelledCount} Cancelled)</td>
        <td>Joined ${new Date(u.createdAt).toLocaleDateString()}</td>
      </tr>
    `;
  }).join('');
}

function initReportsPage() {
  // Initialize Chart.js objects
  dashboardCharts.init(
    'chart-occupancy',
    'chart-weekly',
    'chart-peak',
    'chart-revenue'
  );

  // Populate audit activity logs
  const logs = db.getLogs();
  const logsList = document.getElementById('admin-activity-logs');
  if (logsList) {
    logsList.innerHTML = logs.slice(0, 15).map(l => `
      <div style="font-size:0.85rem; border-bottom: 1px solid var(--border-glass); padding:8px 0; display:flex; justify-content:space-between;">
        <div>
          <strong style="color:var(--gold-primary);">${l.action}</strong> - ${l.details}
          <br><small class="text-muted">By: ${l.user}</small>
        </div>
        <span class="text-muted" style="font-size:0.75rem;">${new Date(l.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join('');
  }
}

// Setup Submissions for Forms
function setupFormListeners() {
  // 1. Customer Login Form
  const loginForm = document.getElementById('login-form-submit');
  if (loginForm) {
    loginForm.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-pass').value;

      if (!email || !pass) {
        window.showNotification('Please fill in all credentials.', 'error');
        return;
      }

      const res = db.login(email, pass);
      if (res.success) {
        window.showNotification(`Welcome back, ${res.user.name}!`, 'success');
        if (res.user.role === 'Admin' || res.user.role === 'Staff') {
          window.location.hash = '#admin-dashboard';
        } else {
          window.location.hash = '#home';
        }
      } else {
        window.showNotification(res.message, 'error');
      }
    });
  }

  // 2. Customer Sign Up Form
  const signupForm = document.getElementById('signup-form-submit');
  if (signupForm) {
    signupForm.addEventListener('click', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const phone = document.getElementById('signup-phone').value;
      const pass = document.getElementById('signup-pass').value;

      if (!name || !email || !phone || !pass) {
        window.showNotification('Please complete all fields.', 'error');
        return;
      }

      const res = db.register(name, email, phone, pass);
      if (res.success) {
        window.showNotification(res.message, 'success');
        window.location.hash = '#login';
      } else {
        window.showNotification(res.message, 'error');
      }
    });
  }

  // 3. User Profile Edit Form
  const profileForm = document.getElementById('profile-form-submit');
  if (profileForm) {
    profileForm.addEventListener('click', (e) => {
      e.preventDefault();
      const user = db.getCurrentUser();
      if (!user) return;

      const name = document.getElementById('profile-name').value;
      const email = document.getElementById('profile-email').value;
      const phone = document.getElementById('profile-phone').value;

      if (!name || !email || !phone) {
        window.showNotification('Fields cannot be blank.', 'error');
        return;
      }

      const res = db.updateProfile(user.id, { name, email, phone });
      if (res.success) {
        window.showNotification('Profile updated successfully.', 'success');
        initProfilePage();
        updateHeaderNav(res.user);
      }
    });
  }

  // 4. Logout trigger
  const logoutButtons = document.querySelectorAll('.logout-trigger');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      db.logout();
      window.showNotification('Logged out successfully.', 'info');
      window.location.hash = '#welcome';
    });
  });

  // 5. Setup Reservation Wizard Proceed
  const setupProceedBtn = document.getElementById('reserve-setup-proceed');
  if (setupProceedBtn) {
    setupProceedBtn.addEventListener('click', () => {
      const dateVal = document.getElementById('booking-date').value;
      const guestsVal = document.getElementById('booking-guests').value;
      const slotSelected = document.querySelector('.time-slot-btn.selected');

      if (!dateVal || !guestsVal || !slotSelected) {
        window.showNotification('Please set date, guests, and a time slot.', 'error');
        return;
      }

      window.location.hash = '#table-layout';
    });
  }

  // 6. Complete Layout Reservation (To confirmation)
  const layoutReserveBtn = document.getElementById('layout-reserve-submit');
  if (layoutReserveBtn) {
    layoutReserveBtn.addEventListener('click', () => {
      if (!bookingState.selectedTableId) {
        window.showNotification('Please select a table to proceed.', 'error');
        return;
      }
      window.location.hash = '#confirmation';
    });
  }

  // 7. Confirm Reservation -> Booking DB Write
  const confirmBookingBtn = document.getElementById('confirm-booking-btn');
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', () => {
      const user = db.getCurrentUser();
      if (!user) return;

      const bookingParams = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        tableId: bookingState.selectedTableId,
        tableName: bookingState.tableName,
        date: bookingState.date,
        timeSlot: bookingState.timeSlot,
        guests: bookingState.guests,
        seatingArea: bookingState.seatingArea,
        notes: document.getElementById('booking-special-requests')?.value || ''
      };

      const res = db.createReservation(bookingParams);
      if (res.success) {
        localStorage.setItem('luxe_recent_booking_id', res.reservation.id);
        
        // Notification log
        console.log(`[Notification System] Booking Confirmation Sent for ID: ${res.reservation.id}`);

        window.showNotification('Booking successfully submitted! Payment optional.', 'success');
        window.location.hash = '#success';
      } else {
        window.showNotification(res.message, 'error');
      }
    });
  }

  // 8. Add/Edit Table Admin Form
  const tableFormSubmit = document.getElementById('table-form-submit-btn');
  if (tableFormSubmit) {
    tableFormSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      const tableId = document.getElementById('table-id-hidden').value;
      const name = document.getElementById('table-name').value;
      const category = document.getElementById('table-category').value;
      const capacity = document.getElementById('table-capacity').value;
      const area = document.getElementById('table-area').value;
      const x = document.getElementById('table-x-coord').value;
      const z = document.getElementById('table-z-coord').value;

      if (!name || !capacity || x === '' || z === '') {
        window.showNotification('Please complete all table properties.', 'error');
        return;
      }

      const tableData = { name, category, capacity, area, x, z };
      
      if (tableId) {
        // Edit Mode
        const res = db.editTable(tableId, tableData);
        if (res.success) {
          window.showNotification(`Table ${name} updated.`, 'success');
          resetTableForm();
          initManageTablesPage();
        }
      } else {
        // Add Mode
        const res = db.addTable(tableData);
        if (res.success) {
          window.showNotification(`Table ${name} created.`, 'success');
          resetTableForm();
          initManageTablesPage();
        }
      }
    });
  }
}

function resetTableForm() {
  document.getElementById('table-id-hidden').value = '';
  document.getElementById('table-name').value = '';
  document.getElementById('table-capacity').value = '4';
  document.getElementById('table-x-coord').value = '0';
  document.getElementById('table-z-coord').value = '0';
  document.getElementById('table-form-submit-btn').textContent = 'Add Table';
}

// AI Floating Chatbot Interface Logic
function setupChatbotUI() {
  const bubble = document.getElementById('ai-chatbot-bubble');
  const windowEl = document.getElementById('ai-chatbot-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const chatInput = document.getElementById('ai-chat-input');
  const chatBody = document.getElementById('ai-chat-body');

  if (!bubble || !windowEl) return;

  bubble.addEventListener('click', () => {
    windowEl.classList.toggle('active');
    // Scroll chat body to bottom
    setTimeout(() => chatBody.scrollTop = chatBody.scrollHeight, 100);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      windowEl.classList.remove('active');
    });
  }

  // Option chips selection matching
  const chips = document.querySelectorAll('.chat-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = chip.textContent;
      submitUserChatMessage(msg);
    });
  });

  const sendMsg = () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    submitUserChatMessage(msg);
    chatInput.value = '';
  };

  if (sendBtn) sendBtn.addEventListener('click', sendMsg);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMsg();
      }
    });
  }
}

function submitUserChatMessage(text) {
  const chatBody = document.getElementById('ai-chat-body');
  const user = db.getCurrentUser();
  if (!chatBody) return;

  // Append user message
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'chat-msg outgoing';
  userMsgEl.textContent = text;
  chatBody.appendChild(userMsgEl);

  chatBody.scrollTop = chatBody.scrollHeight;

  // Bot Typing Simulator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg incoming';
  typingEl.innerHTML = '<i>Typing...</i>';
  chatBody.appendChild(typingEl);
  chatBody.scrollTop = chatBody.scrollHeight;

  setTimeout(() => {
    chatBody.removeChild(typingEl);

    // Call AI response engine
    const result = chatbot.getAIResponse(text, user);
    
    // Append Bot message
    const botMsgEl = document.createElement('div');
    botMsgEl.className = 'chat-msg incoming';
    
    // Format bold markdown titles
    let formattedText = result.response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    botMsgEl.innerHTML = formattedText;
    
    chatBody.appendChild(botMsgEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Handle bot action items
    if (result.action) {
      handleChatbotAction(result.action);
    }

  }, 600);
}

function handleChatbotAction(action) {
  switch (action.type) {
    case 'OPEN_WIZARD':
      window.showNotification('Opening reservation wizard...', 'info');
      setTimeout(() => {
        window.location.hash = '#table-reservation';
      }, 1000);
      break;
      
    case 'DIRECT_BOOKING':
      window.showNotification('Setting reservation properties...', 'success');
      const params = action.payload;
      
      // Update form values directly
      const dateInput = document.getElementById('booking-date');
      const guestsInput = document.getElementById('booking-guests');
      const slotButtons = document.querySelectorAll('.time-slot-btn');
      
      if (dateInput) dateInput.value = params.date;
      if (guestsInput) guestsInput.value = params.guests;
      
      slotButtons.forEach(btn => {
        if (btn.dataset.slot === params.timeSlot) {
          btn.click();
        }
      });
      
      // Select area option
      const seatOptions = document.querySelectorAll('.seating-option');
      seatOptions.forEach(opt => {
        if (opt.dataset.area === params.seatingArea) {
          opt.click();
        }
      });

      // Update state parameters
      bookingState.date = params.date;
      bookingState.guests = params.guests;
      bookingState.timeSlot = params.timeSlot;
      bookingState.seatingArea = params.seatingArea;
      bookingState.selectedTableId = params.tableId;

      const matchedTable = db.getTables().find(t => t.id === params.tableId);
      if (matchedTable) {
        bookingState.tableName = matchedTable.name;
      }

      // Redirect to layout view or confirmation
      setTimeout(() => {
        window.location.hash = '#table-layout';
        // Auto select on Three.js load
        setTimeout(() => {
          if (typeof threeDLayout !== 'undefined') {
            threeDLayout.setSelected(params.tableId);
            // Trigger confirmation click
            const sidePanel = document.getElementById('layout-selection-details');
            const reserveBtn = document.getElementById('layout-reserve-submit');
            if (sidePanel) {
              sidePanel.innerHTML = `
                <span class="table-badge-large">${bookingState.tableName}</span>
                <div class="sidebar-row mt-4"><span>Category:</span> <strong>${matchedTable.category}</strong></div>
                <div class="sidebar-row"><span>Max Capacity:</span> <strong>${matchedTable.capacity} guests</strong></div>
                <div class="sidebar-row"><span>Area:</span> <strong>${matchedTable.area.toUpperCase()}</strong></div>
                <div class="sidebar-row"><span>Occasion Match:</span> <strong style="color: var(--gold-primary);">AI Recommends</strong></div>
              `;
            }
            if (reserveBtn) reserveBtn.disabled = false;
          }
        }, 500);
      }, 1500);
      break;
  }
}
