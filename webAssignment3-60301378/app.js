const express = require('express')
const { engine } = require('express-handlebars')
const path = require('path')
const business = require('./business')

const app = express()

// Handlebars setup (NO layouts)
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

// For reading form POST data
app.use(express.urlencoded({ extended: false }))

// Landing page: list employees
app.get('/', async (req, res) => {
  const employees = await business.listEmployees()
  res.render('landing', { employees })
})

// Employee schedule/details page
app.get('/employee/:id', async (req, res) => {
  const empId = String(req.params.id || '').trim().toUpperCase()

  const result = await business.getEmployeeSchedule(empId)
  if (!result.exists) {
    res.send('Employee not found')
    return
  }

  res.render('details', {
    empId: empId,
    shifts: result.rows
  })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
