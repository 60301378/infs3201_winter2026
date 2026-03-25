const crypto = require('crypto')
const storage = require('./storage')
 
/**
 * Returns all employees from the database.
 * @returns {Promise<Array>} List of employee objects
 */
async function listEmployees() {
  return await storage.getAllEmployees()
}
 
/**
 * Creates a new employee record in the database.
 * @param {string} name - Employee full name
 * @param {string} phone - Employee phone number
 * @param {string} photoFilename - Photo filename to store
 * @returns {Promise<void>}
 */
async function createEmployee(name, phone, photoFilename) {
  await storage.addEmployee({
    name: String(name || '').trim(),
    phone: String(phone || '').trim(),
    photoFilename: photoFilename || ''
  })
}
 
/**
 * Retrieves a single employee by their MongoDB ObjectId.
 * @param {string} empId - The employee's ObjectId string
 * @returns {Promise<Object|null>} Employee document or null if not found
 */
async function getEmployee(empId) {
  return await storage.findEmployee(empId)
}
 
/**
 * Retrieves an employee and their sorted shift list.
 * @param {string} empId - The employee's ObjectId string
 * @returns {Promise<{exists: boolean, employee: Object|null, shifts: Array}>}
 */
async function getEmployeeDetails(empId) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { exists: false, employee: null, shifts: [] }
 
  const shiftDocs = await storage.findShiftsForEmployee(empId)
  const shifts = []
 
  for (let i = 0; i < shiftDocs.length; i++) {
    shifts.push({
      date: shiftDocs[i].date,
      startTime: shiftDocs[i].startTime,
      endTime: shiftDocs[i].endTime,
      morning: shiftDocs[i].startTime < '12:00'
    })
  }
 
  for (let i = 0; i < shifts.length; i++) {
    for (let j = 0; j < shifts.length - 1; j++) {
      const a = shifts[j]
      const b = shifts[j + 1]
      if (a.date > b.date || (a.date === b.date && a.startTime > b.startTime)) {
        const tmp = shifts[j]
        shifts[j] = shifts[j + 1]
        shifts[j + 1] = tmp
      }
    }
  }
 
  return { exists: true, employee: emp, shifts: shifts }
}
 
/**
 * Updates an employee's name, phone, and optionally their photo.
 * @param {string} empId - The employee's ObjectId string
 * @param {string} name - New employee name
 * @param {string} phone - New phone number in format XXXX-XXXX
 * @param {string|undefined} photoFilename - New photo filename, or undefined to keep existing
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
async function updateEmployee(empId, name, phone, photoFilename) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { ok: false, message: 'Employee not found' }
 
  const cleanName = String(name || '').trim()
  const cleanPhone = String(phone || '').trim()
 
  if (!cleanName) return { ok: false, message: 'Name must be non-empty' }
 
  const phoneOk = /^[0-9]{4}-[0-9]{4}$/.test(cleanPhone)
  if (!phoneOk) return { ok: false, message: 'Phone must be 4 digits, dash, 4 digits' }
 
  await storage.updateEmployee(empId, cleanName, cleanPhone, photoFilename)
  return { ok: true }
}
 
/**
 * Validates a login attempt by checking the username and hashed password.
 * @param {string} username - The submitted username
 * @param {string} password - The submitted plain text password
 * @returns {Promise<{ok: boolean, username?: string}>}
 */
async function validateLogin(username, password) {
  try {
    const cleanUsername = String(username || '').trim()
    const cleanPassword = String(password || '').trim()
 
    if (!cleanUsername || !cleanPassword) {
      return { ok: false }
    }
 
    const user = await storage.findUserByUsername(cleanUsername)
    if (!user) {
      return { ok: false }
    }
 
    const hash = storage.sha256(cleanPassword)
 
    if (hash !== user.passwordHash) {
      return { ok: false }
    }
 
    return { ok: true, username: user.username }
 
  } catch (err) {
    console.error('Login error:', err)
    return { ok: false }
  }
}
 
/**
 * Creates a new session for the given user with a 5-minute expiry.
 * @param {string} username - The authenticated username
 * @returns {Promise<{sessionId: string, expiresAt: Date}>}
 */
async function startSession(username) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  await storage.createSession(sessionId, username, expiresAt)
  return { sessionId, expiresAt }
}
 
/**
 * Validates a session and extends its expiry if still active.
 * @param {string} sessionId - The session ID from the cookie
 * @returns {Promise<{username: string, expiresAt: Date}|null>} Session data or null if invalid
 */
async function getValidSession(sessionId) {
  await storage.deleteExpiredSessions()
 
  const session = await storage.findSession(sessionId)
  if (!session) return null
 
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await storage.deleteSession(sessionId)
    return null
  }
 
  const newExpiry = new Date(Date.now() + 5 * 60 * 1000)
  await storage.extendSession(sessionId, newExpiry)
 
  return {
    username: session.username,
    expiresAt: newExpiry
  }
}
 
/**
 * Deletes a session from the database on logout.
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<void>}
 */
async function logout(sessionId) {
  await storage.deleteSession(sessionId)
}
 
/**
 * Logs an access event to the security log collection.
 * @param {string} username - The username if logged in, or empty string
 * @param {string} url - The URL that was accessed
 * @param {string} method - The HTTP method used (GET, POST, etc.)
 * @returns {Promise<void>}
 */
async function logAccess(username, url, method) {
  await storage.addSecurityLog(username, url, method)
}
 
module.exports = {
  listEmployees,
  createEmployee,
  getEmployee,
  getEmployeeDetails,
  updateEmployee,
  validateLogin,
  startSession,
  getValidSession,
  logout,
  logAccess
}
