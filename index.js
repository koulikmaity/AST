const express = require('express');
const ruleRoutes = require('./routes/rules')
const bodyParser = require('body-parser');
require('dotenv').config()

const { mongoose } = require('mongoose');



const app = express();

app.use(bodyParser.json())

mongoose.connect(process.env.MONGOURL, {

}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error', err);
});

// app.use('/', () => {
//     console.log("Home Page");
// })
app.use('/api/rules', ruleRoutes);

const port = 8000;
app.listen(port, () => {
    console.clear()
    console.log(`Server is running on port ${port}`);
} )