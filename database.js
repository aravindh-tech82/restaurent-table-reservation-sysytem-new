// database.js - Mock Database with LocalStorage syncing & initial seed data

const DB_KEYS = {
  USERS: 'luxe_users',
  TABLES: 'luxe_tables',
  RESERVATIONS: 'luxe_reservations',
  REVIEWS: 'luxe_reviews',
  LOGS: 'luxe_activity_logs',
  SESSION: 'luxe_current_session'
};

// Seed Data
const DEFAULT_USERS = [
  {
    id: 'usr-1',
    name: 'Admin User',
    email: 'admin@luxedining.com',
    phone: '+1 (555) 0199',
    password: 'admin123', // In a real app this would be hashed
    role: 'Admin',
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'usr-2',
    name: 'Staff Member',
    email: 'staff@luxedining.com',
    phone: '+1 (555) 0288',
    password: 'staff123',
    role: 'Staff',
    createdAt: '2026-05-02T10:00:00Z'
  },
  {
    id: 'usr-3',
    name: 'John Doe',
    email: 'customer@luxedining.com',
    phone: '+1 (555) 0377',
    password: 'customer123',
    role: 'Customer',
    createdAt: '2026-05-03T10:00:00Z'
  },
  {
    id: 'usr-4',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    phone: '+1 (555) 0466',
    password: 'customer123',
    role: 'Customer',
    createdAt: '2026-05-10T12:30:00Z'
  }
];

const DEFAULT_TABLES = [
  // Indoor Tables (Wooden floor)
  { id: 'tbl-1', name: 'Table 1', category: '2-Seater', capacity: 2, area: 'indoor', x: -6, z: -4 },
  { id: 'tbl-2', name: 'Table 2', category: '2-Seater', capacity: 2, area: 'indoor', x: -6, z: 0 },
  { id: 'tbl-3', name: 'Table 3', category: '4-Seater', capacity: 4, area: 'indoor', x: -2, z: -4 },
  { id: 'tbl-4', name: 'Table 4', category: '4-Seater', capacity: 4, area: 'indoor', x: -2, z: 0 },
  { id: 'tbl-5', name: 'Family Suite 5', category: 'Family', capacity: 8, area: 'indoor', x: 2, z: -4 },
  { id: 'tbl-6', name: 'VIP Booth 6', category: 'VIP', capacity: 4, area: 'indoor', x: 2, z: 1 },
  { id: 'tbl-7', name: 'VIP Lounge 7', category: 'VIP', capacity: 6, area: 'indoor', x: 6, z: -4 },

  // Outdoor Tables (Patio stone area)
  { id: 'tbl-8', name: 'Patio Table 8', category: '2-Seater', capacity: 2, area: 'outdoor', x: -6, z: 5 },
  { id: 'tbl-9', name: 'Patio Table 9', category: '4-Seater', capacity: 4, area: 'outdoor', x: -2, z: 5 },
  { id: 'tbl-10', name: 'Patio Table 10', category: '4-Seater', capacity: 4, area: 'outdoor', x: 2, z: 5 },
  { id: 'tbl-11', name: 'Garden Lounge 11', category: 'Family', capacity: 8, area: 'outdoor', x: 6, z: 5 },
  { id: 'tbl-12', name: 'Patio VIP 12', category: 'VIP', capacity: 4, area: 'outdoor', x: 6, z: 1 }
];

const DEFAULT_RESERVATIONS = [
  // Past reservations (for historical reviews and charts)
  {
    id: 'RES-8921',
    userId: 'usr-3',
    userName: 'John Doe',
    userEmail: 'customer@luxedining.com',
    userPhone: '+1 (555) 0377',
    tableId: 'tbl-6',
    tableName: 'VIP Booth 6',
    date: '2026-06-01',
    timeSlot: '08:00 PM',
    guests: 4,
    seatingArea: 'indoor',
    status: 'Approved',
    notes: 'Anniversary dinner. Would prefer quiet corner.',
    feedback: { rating: 5, comment: 'Exceptional service and the 3D table selection made booking so easy!' },
    timestamp: '2026-05-28T14:22:00Z'
  },
  {
    id: 'RES-8922',
    userId: 'usr-4',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah@example.com',
    userPhone: '+1 (555) 0466',
    tableId: 'tbl-3',
    tableName: 'Table 3',
    date: '2026-06-02',
    timeSlot: '06:00 PM',
    guests: 3,
    seatingArea: 'indoor',
    status: 'Approved',
    notes: 'No seafood please.',
    feedback: { rating: 4, comment: 'Very pleasant evening, food was spectacular!' },
    timestamp: '2026-05-30T10:15:00Z'
  },
  {
    id: 'RES-8923',
    userId: 'usr-3',
    userName: 'John Doe',
    userEmail: 'customer@luxedining.com',
    userPhone: '+1 (555) 0377',
    tableId: 'tbl-8',
    tableName: 'Patio Table 8',
    date: '2026-06-03',
    timeSlot: '12:00 PM',
    guests: 2,
    seatingArea: 'outdoor',
    status: 'Approved',
    notes: 'Sunny table preferred.',
    feedback: { rating: 5, comment: 'Beautiful outdoor garden ambiance.' },
    timestamp: '2026-06-01T09:05:00Z'
  },
  // Upcoming reservation
  {
    id: 'RES-9001',
    userId: 'usr-3',
    userName: 'John Doe',
    userEmail: 'customer@luxedining.com',
    userPhone: '+1 (555) 0377',
    tableId: 'tbl-7',
    tableName: 'VIP Lounge 7',
    date: '2026-06-05',
    timeSlot: '08:00 PM',
    guests: 5,
    seatingArea: 'indoor',
    status: 'Approved',
    notes: 'Business meeting discussion.',
    timestamp: '2026-06-03T18:40:00Z'
  },
  {
    id: 'RES-9002',
    userId: 'usr-4',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah@example.com',
    userPhone: '+1 (555) 0466',
    tableId: 'tbl-11',
    tableName: 'Garden Lounge 11',
    date: '2026-06-06',
    timeSlot: '06:00 PM',
    guests: 6,
    seatingArea: 'outdoor',
    status: 'Pending',
    notes: 'Birthday celebration.',
    timestamp: '2026-06-04T08:12:00Z'
  }
];

const DEFAULT_REVIEWS = [
  { id: 'rev-1', userName: 'John Doe', rating: 5, comment: 'Absolutely stellar! Selecting my exact VIP table beforehand is a game changer.', date: '2026-06-01' },
  { id: 'rev-2', userName: 'Sarah Jenkins', rating: 4, comment: 'The ambiance is breathtaking and the staff was extremely accommodating. Recommended!', date: '2026-06-02' },
  { id: 'rev-3', userName: 'Marcus Brody', rating: 5, comment: 'Excellent gourmet cuisine and a great selection of fine wines.', date: '2026-05-29' }
];

const DEFAULT_LOGS = [
  { id: 'log-1', action: 'System Init', user: 'System', timestamp: '2026-06-04T12:00:00Z', details: 'Mock database seeded' }
];

// Helper methods to read/write localStorage
function getStorageItem(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (!value) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
}

function setStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Database Engine Object
const db = {
  // Initialize Database
  init() {
    this.getUsers();
    this.getTables();
    this.getReservations();
    this.getReviews();
    this.getLogs();
  },

  // User Management
  getUsers() {
    return getStorageItem(DB_KEYS.USERS, DEFAULT_USERS);
  },

  saveUsers(users) {
    setStorageItem(DB_KEYS.USERS, users);
  },

  getCurrentUser() {
    return getStorageItem(DB_KEYS.SESSION, null);
  },

  setCurrentUser(user) {
    setStorageItem(DB_KEYS.SESSION, user);
  },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      // Simulate JWT payload
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: `mock-jwt-header.${btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 3600000 }))}.mock-signature`
      };
      this.setCurrentUser(sessionUser);
      this.addLog('Login Success', user.name, `User ${user.email} logged in as ${user.role}`);
      return { success: true, user: sessionUser };
    }
    this.addLog('Login Failed', 'Guest', `Failed login attempt for ${email}`);
    return { success: false, message: 'Invalid email or password.' };
  },

  register(name, email, phone, password) {
    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Email already registered.' };
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone,
      password,
      role: 'Customer',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    this.addLog('User Registered', name, `New customer account registered: ${email}`);
    return { success: true, message: 'Registration successful! You can now log in.' };
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.addLog('Logout', user.name, `User logged out`);
    }
    this.setCurrentUser(null);
  },

  updateProfile(userId, data) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      this.saveUsers(users);
      
      // Update session if it is the current user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.setCurrentUser({ ...currentUser, ...data });
      }
      this.addLog('Profile Updated', users[index].name, `Updated user profile details`);
      return { success: true, user: users[index] };
    }
    return { success: false, message: 'User not found' };
  },

  resetPassword(email, newPassword) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.password = newPassword;
      this.saveUsers(users);
      this.addLog('Password Reset', user.name, `Password reset request successful`);
      return { success: true, message: 'Password has been reset successfully.' };
    }
    return { success: false, message: 'Email not found.' };
  },

  // Table Management
  getTables() {
    return getStorageItem(DB_KEYS.TABLES, DEFAULT_TABLES);
  },

  saveTables(tables) {
    setStorageItem(DB_KEYS.TABLES, tables);
  },

  addTable(tableData) {
    const tables = this.getTables();
    const newId = `tbl-${Date.now()}`;
    const newTable = {
      id: newId,
      name: tableData.name || `Table ${tables.length + 1}`,
      category: tableData.category || '2-Seater',
      capacity: parseInt(tableData.capacity) || 2,
      area: tableData.area || 'indoor',
      x: parseFloat(tableData.x) || 0,
      z: parseFloat(tableData.z) || 0
    };
    tables.push(newTable);
    this.saveTables(tables);
    
    const admin = this.getCurrentUser();
    this.addLog('Add Table', admin ? admin.name : 'Admin', `Added new table ${newTable.name} (Capacity: ${newTable.capacity})`);
    return { success: true, table: newTable };
  },

  editTable(tableId, tableData) {
    const tables = this.getTables();
    const index = tables.findIndex(t => t.id === tableId);
    if (index !== -1) {
      tables[index] = {
        ...tables[index],
        name: tableData.name,
        category: tableData.category,
        capacity: parseInt(tableData.capacity),
        area: tableData.area,
        x: parseFloat(tableData.x),
        z: parseFloat(tableData.z)
      };
      this.saveTables(tables);
      
      const admin = this.getCurrentUser();
      this.addLog('Edit Table', admin ? admin.name : 'Admin', `Modified table ${tables[index].name}`);
      return { success: true, table: tables[index] };
    }
    return { success: false, message: 'Table not found' };
  },

  deleteTable(tableId) {
    const tables = this.getTables();
    const index = tables.findIndex(t => t.id === tableId);
    if (index !== -1) {
      const tableName = tables[index].name;
      tables.splice(index, 1);
      this.saveTables(tables);
      
      const admin = this.getCurrentUser();
      this.addLog('Delete Table', admin ? admin.name : 'Admin', `Deleted table ${tableName}`);
      return { success: true };
    }
    return { success: false, message: 'Table not found' };
  },

  // Reservation Management
  getReservations() {
    return getStorageItem(DB_KEYS.RESERVATIONS, DEFAULT_RESERVATIONS);
  },

  saveReservations(reservations) {
    setStorageItem(DB_KEYS.RESERVATIONS, reservations);
  },

  createReservation(bookingData) {
    const reservations = this.getReservations();
    const newId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation = {
      id: newId,
      userId: bookingData.userId || 'usr-guest',
      userName: bookingData.userName || 'Walk-in Guest',
      userEmail: bookingData.userEmail || 'guest@example.com',
      userPhone: bookingData.userPhone || 'N/A',
      tableId: bookingData.tableId,
      tableName: bookingData.tableName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      guests: parseInt(bookingData.guests),
      seatingArea: bookingData.seatingArea || 'indoor',
      status: bookingData.status || 'Pending', // default pending, can be 'Approved'
      notes: bookingData.notes || '',
      timestamp: new Date().toISOString()
    };
    
    // Check double booking
    const isDoubleBooked = reservations.some(r => 
      r.tableId === bookingData.tableId && 
      r.date === bookingData.date && 
      r.timeSlot === bookingData.timeSlot &&
      r.status !== 'Cancelled'
    );
    if (isDoubleBooked) {
      return { success: false, message: 'This table is already reserved for the selected date and time slot.' };
    }

    reservations.push(newReservation);
    this.saveReservations(reservations);
    
    this.addLog('Create Reservation', newReservation.userName, `Created booking ${newId} for table ${newReservation.tableName} on ${newReservation.date} at ${newReservation.timeSlot}`);
    return { success: true, reservation: newReservation };
  },

  updateReservationStatus(resId, status) {
    const reservations = this.getReservations();
    const resIndex = reservations.findIndex(r => r.id === resId);
    if (resIndex !== -1) {
      reservations[resIndex].status = status;
      this.saveReservations(reservations);
      
      const admin = this.getCurrentUser();
      this.addLog('Update Reservation', admin ? admin.name : 'Staff', `Changed reservation ${resId} status to ${status}`);
      return { success: true, reservation: reservations[resIndex] };
    }
    return { success: false, message: 'Reservation not found' };
  },

  cancelReservation(resId, userName) {
    return this.updateReservationStatus(resId, 'Cancelled');
  },

  addFeedback(resId, rating, comment) {
    const reservations = this.getReservations();
    const resIndex = reservations.findIndex(r => r.id === resId);
    if (resIndex !== -1) {
      const feedback = { rating: parseInt(rating), comment };
      reservations[resIndex].feedback = feedback;
      this.saveReservations(reservations);

      // Also add to global reviews
      const reviews = this.getReviews();
      const newReview = {
        id: `rev-${Date.now()}`,
        userName: reservations[resIndex].userName,
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString().split('T')[0]
      };
      reviews.unshift(newReview);
      this.saveReviews(reviews);

      this.addLog('Add Feedback', reservations[resIndex].userName, `Added a review for booking ${resId}: ${rating}/5`);
      return { success: true };
    }
    return { success: false, message: 'Reservation not found' };
  },

  // Reviews
  getReviews() {
    return getStorageItem(DB_KEYS.REVIEWS, DEFAULT_REVIEWS);
  },

  saveReviews(reviews) {
    setStorageItem(DB_KEYS.REVIEWS, reviews);
  },

  // Activity Logging
  getLogs() {
    return getStorageItem(DB_KEYS.LOGS, DEFAULT_LOGS);
  },

  addLog(action, user, details) {
    const logs = getStorageItem(DB_KEYS.LOGS, DEFAULT_LOGS);
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      user,
      timestamp: new Date().toISOString(),
      details
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) {
      logs.pop();
    }
    setStorageItem(DB_KEYS.LOGS, logs);
  },

  // Helper: check table availability on a specific date/slot
  getTableAvailability(date, timeSlot) {
    const tables = this.getTables();
    const reservations = this.getReservations();
    
    // Find active reservations for this slot
    const bookedTableIds = reservations
      .filter(r => r.date === date && r.timeSlot === timeSlot && r.status !== 'Cancelled')
      .map(r => r.tableId);

    // Map all tables to their availability status
    return tables.map(table => ({
      ...table,
      isAvailable: !bookedTableIds.includes(table.id)
    }));
  }
};

db.init();
window.db = db; // Export to window for global access across scripts
console.log('Luxe Dining DB Initialized successfully!');
