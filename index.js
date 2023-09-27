"use strict";
const mysql = require('mysql2');
const express = require('express');
const cookieParser = require('cookie-parser');
const ngrok = require('ngrok');
const app = express();
const cfonts = require('cfonts');
const { say } = cfonts;
const ProgressBar = require('progress');
const chalk = require('chalk');
const bodyParser = require('body-parser');
const fs = require('fs');

const dbPool = require('./database/database');

const dbConnection = mysql.createConnection(dbPool);



// Configure the Express app
app.set('view engine', 'ejs');

// Static folders for static files (e.g., CSS, JavaScript)
const staticFolders = ['public', 'views'];

staticFolders.forEach(folder => {
    app.use(express.static(folder));
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Middleware for handling database connections
app.use((req, res, next) => {
    req.db = dbPool;
    next();
});



// Routers, routes, and route handlers

const router = require('./router/router');
app.use('/', router);
app.post('/logi', (req, res) => {
    const { username, password } = req.body;

    console.log('Recibida solicitud de inicio de sesión:', username, password);

    dbConnection.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username], (err, results) => {
        if (err) {
            console.log('Error durante la consulta a la base de datos:', err);
            res.status(500).json({ message: 'Internal Server Error' });
        } else if (results.length === 1) {
            
            if (results[0].password === password) {
                console.log('Inicio de sesión exitoso. Usuario:', username);
                res.json({ message: 'Login successful' });
            } else {
                console.log('Intento de inicio de sesión fallido. Usuario:', username);
                res.status(401).json({ message: 'Authentication failed' });
            }
        } else {
            console.log('Intento de inicio de sesión fallido. Usuario:', username);
            res.status(401).json({ message: 'Authentication failed' });
        }
    });
});


// Progress bar and server initialization

const total = 100;
const duration = 10000;
const speed = total / (duration / 1000); // Increment per second

const bar = new ProgressBar(`${chalk.yellow('Loading')} ${chalk.red(':bar')} :percent`, {
    total: total,
    width: 30,
    renderThrottle: 1000 / speed,
    clear: true,
    complete: `${chalk.bgRed(' ')}${chalk.red('\u2588')}${chalk.bgRed(' ')}`,
    incomplete: '\u2591',
});

const timer = setInterval(async () => {
    bar.tick();
    if (bar.complete) {
        clearInterval(timer);

        // The server starts after the progress bar completes
        const port = process.env.PORT || 3001;
        const server = app.listen(port, async () => {
            say('SERVER STARTED...', {
                align: 'center',
                colors: ['#ff8000']
            });


        
            // Printing the used folders
            console.log(chalk.blue.bold('Used Folders:'));

            staticFolders.forEach((folder, index) => {
                console.log(
                    `${index + 1}. ${chalk.green.bold('Folder Name:')} ${chalk.white(folder)}`
                );
            });
            console.log('\n'); 
            dbConnection.connect((error) => {
                if (error) {
                    console.log(chalk.red.bold('Error de conexión a la base de datos:'), error);
                    return;
                }
                console.log(chalk.green.bold('Conectado a la base de datos MySQL!'));
            });
            console.log(chalk.green.bold(`\nServer Started:`));
            console.log(`- Local URL: ${chalk.blue.underline(`http://localhost:${port}`)}`);

            const ngrokUrl = await ngrok.connect(port);
            console.log(`- Ngrok URL: ${chalk.cyan.underline(ngrokUrl)}`);
        });
    }
}, 1000 / speed);
