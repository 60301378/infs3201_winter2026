const { setServers } = require('node:dns/promises')
setServers(["1.1.1.1", "8.8.8.8"])

const { MongoClient } = require('mongodb')

const DB_NAME = 'infs3201_winter2026'
let client = null

/**
 * Establishes and returns a MongoDB database connection.
 * If a connection does not exist, it creates one.
 * @returns {Promise<import('mongodb').Db>} The MongoDB database instance.
 * @throws {Error} If MONGO_URI environment variable is missing.
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
 * Retrieves all employees from the MongoDB collection.
 * @returns {Promise<Array<Object>>}
 */
async function getAllEmployees() {
  const db = await getDb()
  return await db.collection('employees').find({}).toArray()
}

/**
 * Finds an employee by employee ID.
 * @param {string} empId
 * @returns {Promise<Object|null>}
 */
async function findEmployee(empId) {
  const db = await getDb()
  return await db.collection('employees').findOne({ employeeId: empId })
}

/**
 * Inserts a new employee into the employees collection.
 * @param {Object} employee - The employee object to insert.
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
  const db = await getDb()
  await db.collection('employees').insertOne(employee)
}

/**
 * Updates an existing employee's name and phone number.
 * @param {string} empId - The employee ID to update.
 * @param {string} name - The new employee name.
 * @param {string} phone - The new employee phone number.
 * @returns {Promise<void>}
 */
async function updateEmployee(empId, name, phone) {
  const db = await getDb()
  await db.collection('employees').updateOne(
    { employeeId: empId },
    { $set: { name: name, phone: phone } }
  )
}

/**
 * Finds a shift by its shift ID.
 * @param {string} shiftId - The shift ID to search for.
 * @returns {Promise<Object|null>} A promise that resolves to the shift object if found, otherwise null.
 */
async function findShift(shiftId) {
  const db = await getDb()
  return await db.collection('shifts').findOne({ shiftId: shiftId })
}

/**
 * Retrieves all shift assignments for a given employee.
 * @param {string} empId
 * @returns {Promise<Array<Object>>}
 */
async function getAssignmentsForEmployee(empId) {
  const db = await getDb()
  return await db.collection('assignments').find({ employeeId: empId }).toArray()
}

module.exports = {
  getAllEmployees,
  findEmployee,
  addEmployee,
  updateEmployee,
  findShift,
  getAssignmentsForEmployee
}
