const prompt = require('prompt-sync')()
const business = require('./business')

/**
 * Displays all employees in a table format.
 * @returns {Promise<void>}
 */
async function showEmployees() {
  const employees = await business.listEmployees()

  if (employees.length === 0) {
    console.log('No employees found.')
    return
  }

  console.table(employees)
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
 * Displays employee schedule in table format.
 * @returns {Promise<void>}
 */
async function viewSchedule() {
  const empId = prompt('Enter employee ID: ').trim().toUpperCase()
  const result = await business.getEmployeeSchedule(empId)

  if (!result.exists) {
    console.log('Employee does not exist.')
    return
  }

  if (result.rows.length === 0) {
    console.log('No shifts assigned.')
    return
  }

  console.table(result.rows)
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
    console.log('3. View employee schedule')
    console.log('4. Exit')

    const selection = Number(prompt('Enter option: '))

    if (selection === 1) await showEmployees()
    else if (selection === 2) await addEmployee()
    else if (selection === 3) await viewSchedule()
    else if (selection === 4) break
    else console.log('Invalid option')
  }
}

main()
