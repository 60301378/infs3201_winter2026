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
 
const multer = require('multer')
 
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'employee_photos'))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, req.params.id + ext)  // e.g. "abc123.jpg"
  }
})
 
const upload = multer({ storage: storage_multer })
 
/**
 * Parses a raw cookie header string into a key-value object.
 * @param {string} cookieHeader - The raw cookie header string
 * @returns {Object} Parsed cookies as key-value pairs
 */
function parseCookies(cookieHeader) {
  const cookies = {}
  const text = String(cookieHeader || '')
  const parts = text.split(';')
 
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i].trim()
    const eqPos = item.indexOf('=')
    if (eqPos > 0) {
      const key = item.substring(0, eqPos)
      const value = item.substring(eqPos + 1)
      cookies[key] = decodeURIComponent(value)
    }
  }
 
  return cookies
}
 
/**
 * Middleware that logs every incoming request to the security_log collection.
 * Attaches the username to req.user if a valid session is found.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
async function securityLogMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie)
  const sessionId = cookies.sessionId || ''
  let username = ''
 
  if (sessionId) {
    const session = await business.getValidSession(sessionId)
    if (session) {
      username = session.username
      req.user = session.username
      res.setHeader(
        'Set-Cookie',
        'sessionId=' + encodeURIComponent(sessionId) + '; HttpOnly; Path=/; Max-Age=300'
      )
    }
  }
 
  await business.logAccess(username, req.originalUrl, req.method)
  next()
}
 
/**
 * Middleware that protects all routes except /login and /logout.
 * Redirects unauthenticated users to the login page.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
async function authMiddleware(req, res, next) {
  if (req.path === '/login' || req.path === '/logout') {
    return next()
  }
 
  const cookies = parseCookies(req.headers.cookie)
  const sessionId = cookies.sessionId || ''
 
  if (!sessionId) {
    return res.redirect('/login?msg=' + encodeURIComponent('Please log in'))
  }
 
  const session = await business.getValidSession(sessionId)
  if (!session) {
    return res.redirect('/login?msg=' + encodeURIComponent('Session expired. Please log in again'))
  }
 
  req.user = session.username
  res.setHeader(
    'Set-Cookie',
    'sessionId=' + encodeURIComponent(sessionId) + '; HttpOnly; Path=/; Max-Age=300'
  )
 
  next()
}
 
app.use(securityLogMiddleware)
app.use(authMiddleware)
 
/**
 * GET /login
 * Renders the login page with an optional message.
 */
app.get('/login', (req, res) => {
  res.render('login', { msg: req.query.msg || '' })
})
 
/**
 * POST /login
 * Validates credentials, starts a session, and redirects to home.
 */
app.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim()
  const password = String(req.body.password || '').trim()
 
  const result = await business.validateLogin(username, password)
  if (!result.ok) {
    return res.redirect('/login?msg=' + encodeURIComponent('Invalid username or password'))
  }
 
  const session = await business.startSession(result.username)
 
  res.setHeader(
    'Set-Cookie',
    'sessionId=' + encodeURIComponent(session.sessionId) + '; HttpOnly; Path=/; Max-Age=300'
  )
 
  res.redirect('/')
})
 
/**
 * GET /logout
 * Deletes the session, clears the cookie, and redirects to login.
 */
app.get('/logout', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie)
  const sessionId = cookies.sessionId || ''
 
  if (sessionId) {
    await business.logout(sessionId)
  }
 
  res.setHeader(
    'Set-Cookie',
    'sessionId=; HttpOnly; Path=/; Max-Age=0'
  )
 
  res.redirect('/login?msg=' + encodeURIComponent('Logged out'))
})
 
/**
 * GET /
 * Renders the landing page with a list of all employees.
 */
app.get('/', async (req, res) => {
  const employees = await business.listEmployees()
  res.render('landing', {
    employees,
    msg: req.query.msg || '',
    username: req.user || ''
  })
})
 
/**
 * GET /employee/:id
 * Renders the details page for a single employee including their shifts.
 */
app.get('/employee/:id', async (req, res) => {
  const empId = String(req.params.id || '').trim()
  const result = await business.getEmployeeDetails(empId)
 
  if (!result.exists) return res.send('Employee not found')
 
  res.render('details', {
    employee: result.employee,
    shifts: result.shifts,
    username: req.user || ''
  })
})
 
/**
 * GET /employee/:id/edit
 * Renders the edit form for a single employee.
 */
app.get('/employee/:id/edit', async (req, res) => {
  const empId = String(req.params.id || '').trim()
  const emp = await business.getEmployee(empId)
 
  if (!emp) return res.send('Employee not found')
 
  res.render('edit', {
    employee: emp,
    username: req.user || ''
  })
})
 
/**
 * POST /employee/:id/edit
 * Handles employee update form submission including optional photo upload.
 */
app.post('/employee/:id/edit', upload.single('photo'), async (req, res) => {
  const empId = String(req.params.id || '').trim()
  const name = String(req.body.name || '').trim()
  const phone = String(req.body.phone || '').trim()
 
  const photoFilename = req.file ? req.file.filename : undefined
 
  const result = await business.updateEmployee(empId, name, phone, photoFilename)
  if (!result.ok) return res.send(result.message)
 
  res.redirect('/?msg=' + encodeURIComponent('Employee updated'))
})
 
/**
 * GET /employee/:id/photo
 * Serves the photo file for a given employee.
 * Returns 404 if the employee has no photo or the file does not exist.
 */
app.get('/employee/:id/photo', async (req, res) => {
  const empId = String(req.params.id || '').trim()
  const emp = await business.getEmployee(empId)
 
  if (!emp || !emp.photoFilename) {
    return res.status(404).send('Photo not found')
  }
 
  const photoPath = path.join(__dirname, 'employee_photos', emp.photoFilename)
 
  res.sendFile(photoPath, (err) => {
    if (err) {
      res.status(404).send('Photo not found')
    }
  })
})
 
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
