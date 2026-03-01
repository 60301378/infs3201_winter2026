const storage = require('./storage')

/**
 * Retrieves all employees from persistence.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of employee objects.
 */
async function listEmployees() {
  return await storage.getAllEmployees()
}

/**
 * Generates the next available employee ID.
 * @param {Array<Object>} employees - The list of existing employee objects.
 * @returns {string} The next employee ID in the format 'E###'.
 */
function makeNextEmployeeId(employees) {
  let maxNumber = 0
  for (let i = 0; i < employees.length; i++) {
    const num = parseInt(employees[i].employeeId.substring(1))
    if (num > maxNumber) maxNumber = num
  }
  return 'E' + String(maxNumber + 1).padStart(3, '0')
}

/**
 * Creates a new employee with the next available employee ID.
 * @param {string} name - The employee name.
 * @param {string} phone - The employee phone number.
 * @returns {Promise<void>}
 */
async function createEmployee(name, phone) {
  const employees = await storage.getAllEmployees()
  const newId = makeNextEmployeeId(employees)

  await storage.addEmployee({
    employeeId: newId,
    name: name,
    phone: phone
  })
}

/**
 * Retrieves a single employee by ID.
 * @param {string} empId - The employee ID.
 * @returns {Promise<Object|null>} The employee object or null if not found.
 */
async function getEmployee(empId) {
  return await storage.findEmployee(empId)
}

/**
 * Retrieves employee details along with sorted shifts.
 * @param {string} empId - The employee ID.
 * @returns {Promise<{exists: boolean, employee: Object|null, shifts: Array<Object>}>}
 */
async function getEmployeeDetails(empId) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { exists: false, employee: null, shifts: [] }

  const assignments = await storage.getAssignmentsForEmployee(empId)
  const shifts = []

  for (let i = 0; i < assignments.length; i++) {
    const shift = await storage.findShift(assignments[i].shiftId)
    if (shift) {
      shifts.push({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        morning: shift.startTime < '12:00'
      })
    }
  }

  for (let i = 0; i < shifts.length; i++) {
    for (let j = 0; j < shifts.length - 1; j++) {
      const a = shifts[j]
      const b = shifts[j + 1]
      if (a.date > b.date || (a.date === b.date && a.startTime > b.startTime)) {
        const tmp = shifts[j]
        shifts[j] = shifts[j + 1]
        shifts[j + 1] = tmp
      }
    }
  }

  return { exists: true, employee: emp, shifts: shifts }
}

/**
 * Updates an employee's name and phone after validation.
 * @param {string} empId - The employee ID.
 * @param {string} name - The new name.
 * @param {string} phone - The new phone number.
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
async function updateEmployee(empId, name, phone) {
  const emp = await storage.findEmployee(empId)
  if (!emp) return { ok: false, message: 'Employee not found' }

  const cleanName = String(name || '').trim()
  const cleanPhone = String(phone || '').trim()

  if (!cleanName) return { ok: false, message: 'Name must be non-empty' }

  const phoneOk = /^[0-9]{4}-[0-9]{4}$/.test(cleanPhone)
  if (!phoneOk) return { ok: false, message: 'Phone must be 4 digits, dash, 4 digits' }

  await storage.updateEmployee(empId, cleanName, cleanPhone)
  return { ok: true }
}

module.exports = {
  listEmployees,
  createEmployee,
  getEmployee,
  getEmployeeDetails,
  updateEmployee
}
