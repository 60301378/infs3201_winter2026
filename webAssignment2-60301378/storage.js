const fs = require('fs/promises')

/**
 * Reads a JSON file.
 * @param {string} fileName
 * @returns {Promise<any>}
 */
async function readJson(fileName) {
  const data = await fs.readFile(fileName, 'utf8')
  return JSON.parse(data)
}

/**
 * Writes data to JSON file.
 * @param {string} fileName
 * @param {any} data
 * @returns {Promise<void>}
 */
async function writeJson(fileName, data) {
  await fs.writeFile(fileName, JSON.stringify(data, null, 4))
}

/**
 * Returns all employees.
 * @returns {Promise<Array>}
 */
async function getEmployees() {
  return await readJson('employees.json')
}

/**
 * Saves employees.
 * @param {Array} employees
 * @returns {Promise<void>}
 */
async function saveEmployees(employees) {
  await writeJson('employees.json', employees)
}

/**
 * Returns all shifts.
 * @returns {Promise<Array>}
 */
async function getShifts() {
  return await readJson('shifts.json')
}

/**
 * Returns all assignments.
 * @returns {Promise<Array>}
 */
async function getAssignments() {
  return await readJson('assignments.json')
}

/**
 * Saves assignments.
 * @param {Array} assignments
 * @returns {Promise<void>}
 */
async function saveAssignments(assignments) {
  await writeJson('assignments.json', assignments)
}

module.exports = {
  getEmployees,
  saveEmployees,
  getShifts,
  getAssignments,
  saveAssignments
}
