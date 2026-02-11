const storage = require('./storage')

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
 * Assign employee to shift with checks.
 * @param {string} empId
 * @param {string} shiftId
 * @returns {Promise<{ok:boolean,message:string}>}
 */
async function assignEmployeeToShift(empId, shiftId) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { ok: false, message: 'Employee does not exist' }

  const shift = await storage.findShift(shiftId)
  if (!shift) return { ok: false, message: 'Shift does not exist' }

  const exists = await storage.assignmentExists(empId, shiftId)
  if (exists) return { ok: false, message: 'Employee already assigned to shift' }

  await storage.addAssignment({ employeeId: empId, shiftId: shiftId })
  return { ok: true, message: 'Shift Recorded' }
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
  assignEmployeeToShift,
  getEmployeeSchedule
}
