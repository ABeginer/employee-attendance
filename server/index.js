const express = require('express');
const cors = require('cors')
const routes = require("./src/routes/routes.js")

const connection = require('./src/test/connect.js')
const app = express();
//app.options('*', cors()) 
app.use(express.json());
app.use('/api', routes);

app.listen(4000, () => {
    console.log(`Server Started at ${4000}`)
})