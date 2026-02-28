const storage = require('./storage')

/**
 * Computes shift duration in hours between two times.
 * LLM: ChatGPT
 * Prompt used: "Write a JavaScript function computeShiftDuration(startTime, endTime) that returns the number of hours (decimal) between two HH:MM times. Assume endTime is after startTime."
 * @param {string} startTime Time in HH:MM format
 * @param {string} endTime Time in HH:MM format
 * @returns {number} Number of hours worked
 */
function computeShiftDuration(startTime, endTime) {
  const startParts = startTime.split(':')
  const endParts = endTime.split(':')

  const startMinutes = Number(startParts[0]) * 60 + Number(startParts[1])
  const endMinutes = Number(endParts[0]) * 60 + Number(endParts[1])

  const diffMinutes = endMinutes - startMinutes

  return diffMinutes / 60
}


/**
 * Returns all employees for display.
 * @returns {Promise<Array>}
 */
async function listEmployees() {
  return await storage.getAllEmployees()
}

/**
 * Creates the next employee ID like E001.
 * @param {Array<{employeeId:string}>} employees
 * @returns {string}
 */
function makeNextEmployeeId(employees) {
  let maxNumber = 0
  for (let i = 0; i < employees.length; i++) {
    const num = parseInt(employees[i].employeeId.substring(1))
    if (num > maxNumber) maxNumber = num
  }
  const newId = 'E' + String(maxNumber + 1).padStart(3, '0')
  return newId
}

/**
 * Adds a new employee.
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function createEmployee(name, phone) {
  const employees = await storage.getAllEmployees()
  const newId = makeNextEmployeeId(employees)

  const employee = {
    employeeId: newId,
    name: name,
    phone: phone
  }

  await storage.addEmployee(employee)
}

/**
 * Builds schedule rows for one employee.
 * @param {string} empId
 * @returns {Promise<{exists:boolean,rows:Array<{date:string,startTime:string,endTime:string}>}>}
 */
async function getEmployeeSchedule(empId) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { exists: false, rows: [] }

  const assignments = await storage.getAssignmentsForEmployee(empId)
  const rows = []

  for (let i = 0; i < assignments.length; i++) {
    const shift = await storage.findShift(assignments[i].shiftId)
    if (shift) {
      rows.push({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime
      })
    }
  }

  return { exists: true, rows: rows }
}

module.exports = {
  listEmployees,
  createEmployee,
  getEmployeeSchedule,
  computeShiftDuration
}
