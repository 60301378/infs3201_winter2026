const fs = require('fs/promises')
const prompt = require('prompt-sync')()

/**
 * Reads a JSON file and returns the parsed data
 * @param {string} fileName the name of the json file
 * @returns {Promise<any>} the json data from the file
 */
async function readJson(fileName) {
    const data = await fs.readFile(fileName, 'utf8')
    return JSON.parse(data)
}
/**
 * Writes data into a json file
 * @param {string} fileName name of the json file
 * @param {any} data data to save into the file
 * @returns {Promise<void>}
 */
async function writeJson(fileName, data) {
    await fs.writeFile(fileName, JSON.stringify(data, null, 4))
}

/**
 * Loads all employees from the file and prints them to the screen
 * @returns {Promise<void>}
 */
async function showEmployees() {
    const employees = await readJson('employees.json')

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
 * Prompts the user for employee details and adds a new employee
 * @returns {Promise<void>}
 */

async function addEmployee() {
    const employees = await readJson('employees.json')

    const name = prompt('Enter employee name: ')
    const phone = prompt('Enter phone number: ')

    let maxNumber = 0

    // find the biggest employee number
    for (let i = 0; i < employees.length; i++) {
        const num = parseInt(employees[i].employeeId.substring(1))
        if (num > maxNumber) {
            maxNumber = num
        }
    }

    const newId = 'E' + String(maxNumber + 1).padStart(3, '0')

    employees.push({
        employeeId: newId,
        name: name,
        phone: phone
    })

    await writeJson('employees.json', employees)
    console.log('Employee added...')
}
/**
 * Assigns an employee to a shift if both exist and are not already assigned
 * @returns {Promise<void>}
 */

async function assignShift() {
    const employees = await readJson('employees.json')
    const shifts = await readJson('shifts.json')
    const assignments = await readJson('assignments.json')

    const empId = prompt('Enter employee ID: ')
    const shiftId = prompt('Enter shift ID: ')

    let empExists = false
    for (let i = 0; i < employees.length; i++) {
        if (employees[i].employeeId === empId) {
            empExists = true
        }
    }

    if (!empExists) {
        console.log('Employee does not exist')
        return
    }

    let shiftExists = false
    for (let i = 0; i < shifts.length; i++) {
        if (shifts[i].shiftId === shiftId) {
            shiftExists = true
        }
    }

    if (!shiftExists) {
        console.log('Shift does not exist')
        return
    }

    // check if employee already has this shift
    for (let i = 0; i < assignments.length; i++) {
        if (
            assignments[i].employeeId === empId &&
            assignments[i].shiftId === shiftId
        ) {
            console.log('Employee already assigned to shift')
            return
        }
    }

    assignments.push({
        employeeId: empId,
        shiftId: shiftId
    })

    await writeJson('assignments.json', assignments)
    console.log('Shift Recorded')
}
/**
 * Displays the schedule for a given employee in CSV format
 * @returns {Promise<void>}
 */

async function viewSchedule() {
    const employees = await readJson('employees.json')
    const shifts = await readJson('shifts.json')
    const assignments = await readJson('assignments.json')

    const empId = prompt('Enter employee ID: ')

    let empExists = false
    for (let i = 0; i < employees.length; i++) {
        if (employees[i].employeeId === empId) {
            empExists = true
        }
    }

    console.log('date,startTime,endTime')

    if (!empExists) {
        return
    }
    for (let i = 0; i < assignments.length; i++) {
        if (assignments[i].employeeId === empId) {
            for (let j = 0; j < shifts.length; j++) {
                if (shifts[j].shiftId === assignments[i].shiftId) {
                    console.log(
                        shifts[j].date + ',' +
                        shifts[j].startTime + ',' +
                        shifts[j].endTime
                    )
                }
            }
        }
    }
}
/**
 * Runs the main application loop and handles user menu choices
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

        let selection = Number(prompt('Enter option: '))

        if (selection === 1) {
            await showEmployees()
        }
        else if (selection === 2) {
            await addEmployee()
        }
        else if (selection === 3) {
            await assignShift()
        }
        else if (selection === 4) {
            await viewSchedule()
        }
        else if (selection === 5) {
            break
        }
        else {
            console.log('******** ERROR!!! Pick a number between 1 and 5')
        }
    }
}

// start the program
main()
