import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import cors from 'cors';
import { Database, Middleware } from 'qurba-node-common';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

Database.connect();

const app = express();

if (process.env.NODE_ENV === 'DEVELOPMENT') {
	app.use(morgan('dev'));
}
app.use(express.json());

app.use(cors());

app.use('/auth', userRoutes);

// For testing purposes only
app.get('/', (req, res) => {
	res.send('Auth API online');
});

app.use(Middleware.PathHandler);
app.use(Middleware.ErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
	console.log(`Auth server running in ${process.env.NODE_ENV} mode on port ${PORT}`.green.bold)
);
