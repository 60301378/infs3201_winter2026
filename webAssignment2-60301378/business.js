const storage = require('./storage')

/**
 * Returns all employees.
 * @returns {Promise<Array>}
 */
async function listEmployees() {
  return await storage.getEmployees()
}

/**
 * Creates a new employee.
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function createEmployee(name, phone) {
  const employees = await storage.getEmployees()

  let maxNumber = 0
  for (let i = 0; i < employees.length; i++) {
    const num = parseInt(employees[i].employeeId.substring(1))
    if (num > maxNumber) maxNumber = num
  }

  const newId = 'E' + String(maxNumber + 1).padStart(3, '0')

  employees.push({
    employeeId: newId,
    name: name,
    phone: phone
  })

  await storage.saveEmployees(employees)
}

/**
 * Assigns employee to shift (basic checks).
 * @param {string} empId
 * @param {string} shiftId
 * @returns {Promise<{ok:boolean,message:string}>}
 */
async function assignEmployeeToShift(empId, shiftId) {
  const employees = await storage.getEmployees()
  const shifts = await storage.getShifts()
  const assignments = await storage.getAssignments()

  let empExists = false
  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId === empId) empExists = true
  }

  if (!empExists) {
    return { ok: false, message: 'Employee does not exist' }
  }

  let shiftExists = false
  for (let i = 0; i < shifts.length; i++) {
    if (shifts[i].shiftId === shiftId) shiftExists = true
  }

  if (!shiftExists) {
    return { ok: false, message: 'Shift does not exist' }
  }

  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].employeeId === empId &&
        assignments[i].shiftId === shiftId) {
      return { ok: false, message: 'Employee already assigned to shift' }
    }
  }

  assignments.push({ employeeId: empId, shiftId: shiftId })
  await storage.saveAssignments(assignments)

  return { ok: true, message: 'Shift Recorded' }
}

/**
 * Returns schedule rows for employee.
 * @param {string} empId
 * @returns {Promise<{exists:boolean,rows:Array}>}
 */
async function getEmployeeSchedule(empId) {
  const employees = await storage.getEmployees()
  const shifts = await storage.getShifts()
  const assignments = await storage.getAssignments()

  let empExists = false
  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId === empId) empExists = true
  }

  if (!empExists) {
    return { exists: false, rows: [] }
  }

  const rows = []

  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].employeeId === empId) {
      for (let j = 0; j < shifts.length; j++) {
        if (shifts[j].shiftId === assignments[i].shiftId) {
          rows.push({
            date: shifts[j].date,
            startTime: shifts[j].startTime,
            endTime: shifts[j].endTime
          })
        }
      }
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
