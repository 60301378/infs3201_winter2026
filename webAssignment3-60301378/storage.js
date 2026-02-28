const fs = require('fs/promises')

/**
 * Reads a JSON file and parses it.
 * @param {string} fileName
 * @returns {Promise<any>}
 */
async function readJson(fileName) {
  const data = await fs.readFile(fileName, 'utf8')
  return JSON.parse(data)
}

/**
 * Writes data into a JSON file.
 * @param {string} fileName
 * @param {any} data
 * @returns {Promise<void>}
 */
async function writeJson(fileName, data) {
  await fs.writeFile(fileName, JSON.stringify(data, null, 4))
}

/**
 * Returns all employees (needed for listing + new ID generation).
 * @returns {Promise<Array<{employeeId:string,name:string,phone:string}>>}
 */
async function getAllEmployees() {
  return await readJson('employees.json')
}

/**
 * Finds one employee by ID.
 * @param {string} empId
 * @returns {Promise<{employeeId:string,name:string,phone:string}|null>}
 */
async function findEmployee(empId) {
  const employees = await readJson('employees.json')
  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId === empId) return employees[i]
  }
  return null
}

/**
 * Adds one employee.
 * @param {{employeeId:string,name:string,phone:string}} employee
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
  const employees = await readJson('employees.json')
  employees.push(employee)
  await writeJson('employees.json', employees)
}

/**
 * Finds one shift by ID.
 * @param {string} shiftId
 * @returns {Promise<{shiftId:string,date:string,startTime:string,endTime:string}|null>}
 */
async function findShift(shiftId) {
  const shifts = await readJson('shifts.json')
  for (let i = 0; i < shifts.length; i++) {
    if (shifts[i].shiftId === shiftId) return shifts[i]
  }
  return null
}

/**
 * Returns all assignments.
 * @returns {Promise<Array<{employeeId:string,shiftId:string}>>}
 */
async function getAllAssignments() {
  return await readJson('assignments.json')
}

/**
 * Returns assignments only for one employee.
 * @param {string} empId
 * @returns {Promise<Array<{employeeId:string,shiftId:string}>>}
 */
async function getAssignmentsForEmployee(empId) {
  const assignments = await readJson('assignments.json')
  const result = []
  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].employeeId === empId) result.push(assignments[i])
  }
  return result
}

/**
 * Loads configuration settings from config.json.
 * @returns {Promise<{maxDailyHours:number}>}
 */
async function getConfig() {
  return await readJson('config.json')
}


module.exports = {
  getAllEmployees,
  findEmployee,
  addEmployee,
  findShift,
  getAllAssignments,
  getAssignmentsForEmployee,
  getConfig
}
