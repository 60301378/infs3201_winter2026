const { setServers } = require('node:dns/promises')
setServers(["1.1.1.1", "8.8.8.8"])

const { MongoClient } = require('mongodb')

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

async function getAllEmployees() {
  const db = await getDb()
  return await db.collection('employees').find({}).toArray()
}

async function findEmployee(empId) {
  const db = await getDb()
  return await db.collection('employees').findOne({ employeeId: empId })
}

async function addEmployee(employee) {
  const db = await getDb()
  await db.collection('employees').insertOne(employee)
}

async function updateEmployee(empId, name, phone) {
  const db = await getDb()
  await db.collection('employees').updateOne(
    { employeeId: empId },
    { $set: { name: name, phone: phone } }
  )
}

async function findShift(shiftId) {
  const db = await getDb()
  return await db.collection('shifts').findOne({ shiftId: shiftId })
}

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
