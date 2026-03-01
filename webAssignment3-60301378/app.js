const express = require('express')
const { engine } = require('express-handlebars')
const path = require('path')
const business = require('./business')

const app = express()

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

// Landing
app.get('/', async (req, res) => {
  const employees = await business.listEmployees()
  res.render('landing', { employees, msg: req.query.msg || '' })
})

// Details page
app.get('/employee/:id', async (req, res) => {
  const empId = String(req.params.id || '').trim().toUpperCase()
  const result = await business.getEmployeeDetails(empId)

  if (!result.exists) return res.send('Employee not found')

  res.render('details', { employee: result.employee, shifts: result.shifts })
})

// Edit page (GET)
app.get('/employee/:id/edit', async (req, res) => {
  const empId = String(req.params.id || '').trim().toUpperCase()
  const emp = await business.getEmployee(empId)

  if (!emp) return res.send('Employee not found')

  res.render('edit', { employee: emp })
})

// Edit submit (POST + validation + PRG)
app.post('/employee/:id/edit', async (req, res) => {
  const empId = String(req.params.id || '').trim().toUpperCase()
  const name = String(req.body.name || '').trim()
  const phone = String(req.body.phone || '').trim()

  const result = await business.updateEmployee(empId, name, phone)
  if (!result.ok) return res.send(result.message)

  res.redirect('/?msg=' + encodeURIComponent('Employee updated'))
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
