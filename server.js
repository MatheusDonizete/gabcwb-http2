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
/*const server = spdy.createServer({
    spdy: {
        plain: true,
        ssl: false
    }
});*/
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