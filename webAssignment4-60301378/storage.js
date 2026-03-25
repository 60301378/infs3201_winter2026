const { setServers } = require('node:dns/promises')
setServers(['1.1.1.1', '8.8.8.8'])
 
const crypto = require('crypto')
const { MongoClient, ObjectId } = require('mongodb')
 
const DB_NAME = 'infs3201_winter2026'
let client = null
 
/**
 * Returns a connected MongoDB database instance.
 * @returns {Promise<import('mongodb').Db>} Connected database object
 */
async function getDb() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGO_URI env var')
 
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
 
  return client.db(DB_NAME)
}
 
/**
 * Converts a string to a MongoDB ObjectId.
 * @param {string} id - The string to convert
 * @returns {import('mongodb').ObjectId|null} ObjectId or null if invalid
 */
function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null
  return new ObjectId(id)
}
 
/**
 * Retrieves all employees from the database.
 * @returns {Promise<Array>} List of all employee documents
 */
async function getAllEmployees() {
  const db = await getDb()
  return await db.collection('employees').find({}).toArray()
}
 
/**
 * Finds a single employee by their MongoDB ObjectId.
 * @param {string} empId - The employee's ObjectId string
 * @returns {Promise<Object|null>} Employee document or null if not found
 */
async function findEmployee(empId) {
  const db = await getDb()
  const objectId = toObjectId(empId)
  if (!objectId) return null
 
  return await db.collection('employees').findOne({ _id: objectId })
}
 
/**
 * Inserts a new employee document into the database.
 * @param {Object} employee - Employee object with name, phone, and photoFilename
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
  const db = await getDb()
  await db.collection('employees').insertOne(employee)
}
 
/**
 * Updates an employee's name, phone, and optionally their photo filename.
 * @param {string} empId - The employee's ObjectId string
 * @param {string} name - Updated employee name
 * @param {string} phone - Updated phone number
 * @param {string|undefined} photoFilename - New photo filename, or undefined to keep existing
 * @returns {Promise<void>}
 */
async function updateEmployee(empId, name, phone, photoFilename) {
  const db = await getDb()
  const objectId = toObjectId(empId)
  if (!objectId) return
 
  const updateDoc = {
    name: name,
    phone: phone
  }
 
  if (photoFilename !== undefined) {
    updateDoc.photoFilename = photoFilename
  }
 
  await db.collection('employees').updateOne(
    { _id: objectId },
    { $set: updateDoc }
  )
}
 
/**
 * Finds all shifts that contain the given employee's ObjectId.
 * @param {string} empId - The employee's ObjectId string
 * @returns {Promise<Array>} List of shift documents
 */
async function findShiftsForEmployee(empId) {
  const db = await getDb()
  const objectId = toObjectId(empId)
  if (!objectId) return []
 
  return await db.collection('shifts').find({
    employees: objectId
  }).toArray()
}
 
/**
 * Finds a user document by username.
 * @param {string} username - The username to look up
 * @returns {Promise<Object|null>} User document or null if not found
 */
async function findUserByUsername(username) {
  const db = await getDb()
  return await db.collection('users').findOne({ username: username })
}
 
/**
 * Creates a new session record in the database.
 * @param {string} sessionId - The unique session ID
 * @param {string} username - The username associated with the session
 * @param {Date} expiresAt - The expiry date and time
 * @returns {Promise<void>}
 */
async function createSession(sessionId, username, expiresAt) {
  const db = await getDb()
  await db.collection('sessions').insertOne({
    sessionId: sessionId,
    username: username,
    expiresAt: expiresAt
  })
}
 
/**
 * Finds a session by its session ID.
 * @param {string} sessionId - The session ID to look up
 * @returns {Promise<Object|null>} Session document or null if not found
 */
async function findSession(sessionId) {
  const db = await getDb()
  return await db.collection('sessions').findOne({ sessionId: sessionId })
}
 
/**
 * Updates the expiry time of an existing session.
 * @param {string} sessionId - The session ID to extend
 * @param {Date} expiresAt - The new expiry date and time
 * @returns {Promise<void>}
 */
async function extendSession(sessionId, expiresAt) {
  const db = await getDb()
  await db.collection('sessions').updateOne(
    { sessionId: sessionId },
    { $set: { expiresAt: expiresAt } }
  )
}
 
/**
 * Deletes a session from the database.
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  const db = await getDb()
  await db.collection('sessions').deleteOne({ sessionId: sessionId })
}
 
/**
 * Deletes all sessions that have passed their expiry time.
 * @returns {Promise<void>}
 */
async function deleteExpiredSessions() {
  const db = await getDb()
  await db.collection('sessions').deleteMany({
    expiresAt: { $lt: new Date() }
  })
}
 
/**
 * Inserts a security log entry for an incoming request.
 * @param {string} username - The username if known, or empty string
 * @param {string} url - The URL that was accessed
 * @param {string} method - The HTTP method (GET, POST, etc.)
 * @returns {Promise<void>}
 */
async function addSecurityLog(username, url, method) {
  const db = await getDb()
  await db.collection('security_log').insertOne({
    timestamp: new Date(),
    username: username || '',
    url: url,
    method: method
  })
}
 
/**
 * Hashes a string using SHA-256.
 * @param {string} text - The plain text to hash
 * @returns {string} The hex-encoded SHA-256 hash
 */
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}
 
module.exports = {
  getAllEmployees,
  findEmployee,
  addEmployee,
  updateEmployee,
  findShiftsForEmployee,
  findUserByUsername,
  createSession,
  findSession,
  extendSession,
  deleteSession,
  deleteExpiredSessions,
  addSecurityLog,
  sha256
}
