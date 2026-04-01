const express = require('express')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// Port section 
const PORT = process.env.PORT || 5200
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
