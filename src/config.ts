import dotenv from 'dotenv';
dotenv.config({path: `secret.env`});

export let config = {
    "devPort": 3001,
    "prodPort": 8080,
    "devMode": false,
    "no-cors": true,
    "secret": process.env.SECRET_PASSPHRASE
};