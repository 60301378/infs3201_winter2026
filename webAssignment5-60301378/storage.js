const { setServers } = require('node:dns/promises')
setServers(['1.1.1.1', '8.8.8.8'])

const crypto = require('crypto')
const { MongoClient, ObjectId } = require('mongodb')

const DB_NAME = 'infs3201_winter2026'
let client = null

async function getDb() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGO_URI env var')

  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }

  return client.db(DB_NAME)
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null
  return new ObjectId(id)
}

async function getAllEmployees() {
  const db = await getDb()
  return await db.collection('employees').find({}).toArray()
}

async function findEmployee(empId) {
  const db = await getDb()
  const objectId = toObjectId(empId)
  if (!objectId) return null

  return await db.collection('employees').findOne({ _id: objectId })
}

async function addEmployee(employee) {
  const db = await getDb()
  await db.collection('employees').insertOne(employee)
}

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

async function findShiftsForEmployee(empId) {
  const db = await getDb()
  const objectId = toObjectId(empId)
  if (!objectId) return []

  return await db.collection('shifts').find({
    employees: objectId
  }).toArray()
}

async function findUserByUsername(username) {
  const db = await getDb()
  return await db.collection('users').findOne({ username: username })
}

async function createSession(sessionId, username, expiresAt) {
  const db = await getDb()
  await db.collection('sessions').insertOne({
    sessionId: sessionId,
    username: username,
    expiresAt: expiresAt
  })
}

async function findSession(sessionId) {
  const db = await getDb()
  return await db.collection('sessions').findOne({ sessionId: sessionId })
}

async function extendSession(sessionId, expiresAt) {
  const db = await getDb()
  await db.collection('sessions').updateOne(
    { sessionId: sessionId },
    { $set: { expiresAt: expiresAt } }
  )
}

async function deleteSession(sessionId) {
  const db = await getDb()
  await db.collection('sessions').deleteOne({ sessionId: sessionId })
}

async function deleteExpiredSessions() {
  const db = await getDb()
  await db.collection('sessions').deleteMany({
    expiresAt: { $lt: new Date() }
  })
}

async function addSecurityLog(username, url, method) {
  const db = await getDb()
  await db.collection('security_log').insertOne({
    timestamp: new Date(),
    username: username || '',
    url: url,
    method: method
  })
}

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