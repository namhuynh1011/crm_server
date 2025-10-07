import express from 'express';
require('dotenv').config();
import cors from 'cors'
import connectDatabase from './src/config/connectDatabase.js';
import initRoutes from './src/routes/index.js';

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "PUT", "POST", "DELETE"],
}))

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initRoutes(app);
connectDatabase();

const PORT = process.env.PORT || 8080;
const listener = app.listen(PORT, () => {
    console.log(`Server is running on port ${listener.address().port}`)
});