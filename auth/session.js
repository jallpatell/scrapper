const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()

const userId = process.env.id
const password = process.env.password

console.log(process.env)