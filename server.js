'use strict';

const spdy = require('spdy');
const fs = require('fs');
const express = require('express');
const app = express();
const options = {
    key: fs.readFileSync(`${__dirname}/server.key`),
    cert: fs.readFileSync(`${__dirname}/server.crt`)
};

const server = spdy.createServer(options, app);
app.use(function(req, res, next) {
    if (!req.headers['x-forwarded-proto']) {
        if (req.headers['x-arr-ssl'] || req.headers['x-iisnode-https'] === 'on') {
            req.headers['x-forwarded-proto'] = 'https';
        }
    }

    next();
});

app.use(function httpOnly(req, res, next) {
    if (req.protocol === 'http' && process.env.NODE_ENV && process.env.NODE_ENV != 'development') {
        return res.redirect(301, 'https://' + req.get('host') + req.url);
    }

    next();
})

app.get('/', (req, res) => {
    const pageHTML = fs.readFileSync(`${__dirname}/static/index.html`);
    const jsOptions = {
        status: 200, // opcional
        method: 'GET', // opcional
        request: {
            accept: '*/*'
        },
        response: {
            'content-type': 'application/javascript'
        }
    };
    if (res.push) {
        let stream = res.push(`/app.js`, jsOptions);
        stream.on('error', () => {});
        stream.write(`alert('HTTP/2 Server Push Habilitado :)');`); //Método write() mantém a resposta aberta
        stream.end(fs.readFileSync(`${__dirname}/static/js/app.js`)); // Método end() fecha automaticamente a conexão   
    }

    res.set('Content-Type', 'text/html');
    res.send(new Buffer(pageHTML));
});
app.use(express.static(`${__dirname}/static`));

server.listen(process.env.PORT || 3000, () => {
    let host = server.address().address;
    let port = server.address().port;
    console.log(`Listening at: https://${host}:${port}`);
});