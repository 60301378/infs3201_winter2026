const prompt = require('prompt-sync')()
const business = require('./business')

/**
 * Displays all employees in a formatted table.
 * @returns {Promise<void>}
 */
async function showEmployees() {
  const employees = await business.listEmployees()

  console.log('Employee ID Name                 Phone')
  console.log('----------- -------------------- --------')

  for (let i = 0; i < employees.length; i++) {
    console.log(
      employees[i].employeeId.padEnd(11) +
      employees[i].name.padEnd(21) +
      employees[i].phone
    )
  }
}

/**
 * Prompts the user for employee info and adds the employee.
 * @returns {Promise<void>}
 */
async function addEmployee() {
  const name = prompt('Enter employee name: ')
  const phone = prompt('Enter phone number: ')
  await business.createEmployee(name, phone)
  console.log('Employee added...')
}

/**
 * Prompts the user for an employee ID and shift ID and assigns the shift.
 * @returns {Promise<void>}
 */
async function assignShift() {
  const empId = prompt('Enter employee ID: ')
  const shiftId = prompt('Enter shift ID: ')
  const result = await business.assignEmployeeToShift(empId, shiftId)
  console.log(result.message)
}

/**
 * Prompts the user for an employee ID and displays the schedule in CSV format.
 * @returns {Promise<void>}
 */
async function viewSchedule() {
  const empId = prompt('Enter employee ID: ')
  const result = await business.getEmployeeSchedule(empId)

  console.log('date,startTime,endTime')

  if (!result.exists) {
    return
  }

  for (let i = 0; i < result.rows.length; i++) {
    console.log(
      result.rows[i].date + ',' +
      result.rows[i].startTime + ',' +
      result.rows[i].endTime
    )
  }
}

/**
 * Runs the main menu loop and calls the correct function based on the user's choice.
 * @returns {Promise<void>}
 */
async function main() {
  while (true) {
    console.log('Options:')
    console.log('1. Show all employees')
    console.log('2. Add new employee')
    console.log('3. Assign employee to shift')
    console.log('4. View employee schedule')
    console.log('5. Exit')

    const selection = Number(prompt('Enter option: '))

    if (selection === 1) await showEmployees()
    else if (selection === 2) await addEmployee()
    else if (selection === 3) await assignShift()
    else if (selection === 4) await viewSchedule()
    else if (selection === 5) break
    else console.log('Invalid option')
  }
}

main()
