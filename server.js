import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import { Database, Middleware } from 'qurba-node-common';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

Database.connect();

const app = express();

if (process.env.NODE_ENV === 'DEVELOPMENT') {
	app.use(morgan('dev'));
}
app.use(express.json());

// To avoid localhost conflicts from chrome in sending http requests (could also use cors)
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', '*');

	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

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
