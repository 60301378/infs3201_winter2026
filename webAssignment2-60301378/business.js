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
 * Calculates total scheduled hours for an employee on a specific date.
 * @param {string} empId Employee ID
 * @param {string} date Date to calculate hours for
 * @returns {Promise<number>} Total hours worked on that date
 */
async function getHoursForEmployeeOnDate(empId, date) {
  const assignments = await storage.getAssignmentsForEmployee(empId)

  let totalHours = 0

  for (let i = 0; i < assignments.length; i++) {
    const shift = await storage.findShift(assignments[i].shiftId)

    if (shift && shift.date === date) {
      totalHours += computeShiftDuration(
        shift.startTime,
        shift.endTime
      )
    }
  }

  return totalHours
}


/**
 * Assigns employee to shift with daily hour limit check.
 * @param {string} empId Employee ID
 * @param {string} shiftId Shift ID
 * @returns {Promise<{ok:boolean,message:string}>}
 */
async function assignEmployeeToShift(empId, shiftId) {
  const emp = await storage.findEmployee(empId)
  if (!emp) {
    return { ok: false, message: 'Employee does not exist' }
  }

  const shift = await storage.findShift(shiftId)
  if (!shift) {
    return { ok: false, message: 'Shift does not exist' }
  }

  const alreadyAssigned = await storage.assignmentExists(empId, shiftId)
  if (alreadyAssigned) {
    return { ok: false, message: 'Employee already assigned to shift' }
  }

  const config = await storage.getConfig()
  const maxDailyHours = Number(config.maxDailyHours)

  const currentHours = await getHoursForEmployeeOnDate(empId, shift.date)

  const newShiftHours = computeShiftDuration(
    shift.startTime,
    shift.endTime
  )

  if (currentHours + newShiftHours > maxDailyHours) {
    return { ok: false, message: 'Daily hour limit exceeded' }
  }

  await storage.addAssignment({
    employeeId: empId,
    shiftId: shiftId
  })

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
  getEmployeeSchedule,
  computeShiftDuration
}

