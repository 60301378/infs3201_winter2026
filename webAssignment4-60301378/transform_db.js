const { setServers } = require('node:dns/promises')
setServers(['1.1.1.1', '8.8.8.8'])

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

async function step1CreateEmptyEmployeesArray() {
  const db = await getDb()
  await db.collection('shifts').updateMany(
    { employees: { $exists: false } },
    { $set: { employees: [] } }
  )
}

async function step2EmbedEmployeesInShifts() {
  const db = await getDb()
  const assignments = await db.collection('assignments').find({}).toArray()

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i]

    const employee = await db.collection('employees').findOne({
      employeeId: assignment.employeeId
    })

    const shift = await db.collection('shifts').findOne({
      shiftId: assignment.shiftId
    })

    if (employee && shift) {
      await db.collection('shifts').updateOne(
        { _id: shift._id },
        { $addToSet: { employees: employee._id } }
      )
    }
  }
}

async function step3RemoveEmployeeId() {
  const db = await getDb()
  await db.collection('employees').updateMany(
    {},
    { $unset: { employeeId: '' } }
  )
}

async function step3RemoveShiftId() {
  const db = await getDb()
  await db.collection('shifts').updateMany(
    {},
    { $unset: { shiftId: '' } }
  )
}

async function step3DropAssignments() {
  const db = await getDb()
  const collections = await db.listCollections({ name: 'assignments' }).toArray()

  if (collections.length > 0) {
    await db.collection('assignments').drop()
  }
}

async function run() {
  try {
    await step1CreateEmptyEmployeesArray()
    console.log('Step 1 done')

    await step2EmbedEmployeesInShifts()
    console.log('Step 2 done')

    await step3RemoveEmployeeId()
    console.log('Step 3a done')

    await step3RemoveShiftId()
    console.log('Step 3b done')

    await step3DropAssignments()
    console.log('Step 3c done')

    console.log('Database transformation complete')
  } catch (err) {
    console.error(err)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

run()