// Import third party libraries
import express from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { xss } from 'express-xss-sanitizer';
import colors from 'colors';

// Import first party libraries and data
import {config} from './config';
import {RouteHandler} from './RouteHandler';
import {User} from './models/User.model';
import {Journal} from './models/Journal.model';
import {runMediaServer} from './MediaServer';

// Run DotENV
dotenv.config({path: `secret.env`});

config.devMode ? console.log(colors.bold(colors.yellow(`[STARTUP] Starting up in DEV mode!`))) : console.log(colors.bold(colors.yellow(`[STARTUP] Starting up in PROD mode!`)));

export let app = express();
export let uptimestart = Date.now();

// Setup rate limit for the API
const limiter = rateLimit({
    windowMs: 1000,
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(bodyParser.json({limit: `50mb`}));
app.use(xss());

// Cors Headers
if(config[`no-cors`]){
    app.use((req, res, next) => {
        res.append(`Access-Control-Allow-Origin`, [`*`]).append(`Access-Control-Allow-Methods`, `GET,PUT,POST,PATCH,DELETE`).append(`Access-Control-Allow-Headers`, `Content-Type,Authorization`);
        next();
    });
}

let MainRouteHandler = new RouteHandler(`1`);
MainRouteHandler.LoadRoutes();

let URI: string;
config.devMode ? URI = process.env.MONGO_URI_DEV : URI = process.env.MONGO_URI_PROD;

mongoose.connect(URI, {dbName: `${config.devMode ? `post-it-server` : `postIt`}`}).then(async () => {
    console.log(colors.green(`[MongoDB] Succesfully Connected to MongoDB Atlas!`));

    // Add bios if not found
    let users = await User.find({});
    users.forEach(async user => {
        if(!user?.bio) user.bio = `No bio written`;
        await user.save();
        return;
    });

    // Add bookmarks and ratings
    let journals = await Journal.find({});
    journals.forEach(async j => {
        if(!j?.rating) {
            j.rating = [];
            j.save();
        }
    });

    // Create dev models
    console.log(colors.yellow(`[MongoDB] Looking for default user...`));
    let DefaultUser = await User.findOne({id: `1`}) || null;
    if(!DefaultUser){
        console.log(colors.green(`[MongoDB] Couldn't find default user! Creating it...`));
        DefaultUser = new User({
            username: `System`,
            token: `systemtoken1`,
            pfp: `none`,
            id: `1`,
            bio: `System User Account`
        });
        DefaultUser.save();
        console.log(colors.green(`[MongoDB] Default user created!`));
    }
    else console.log(colors.green(`[MongoDB] Default user found!`));

    console.log(colors.yellow(`[MongoDB] Looking for default journal...`));
    let DefaultJournal = await Journal.findOne({id: `1`}) || null;
    if(!DefaultJournal){
        console.log(colors.green(`[MongoDB] Couldn't find default journal! Creating it...`));
        DefaultJournal = new Journal({
            title: `Default Journal`,
            id: `1`,
            authorID: `1`,
            visibility: `private`,
            isDraft: false
        });
        DefaultJournal.save();
        console.log(colors.green(`[MongoDB] Default journal created!`));
    }
    else console.log(colors.green(`[MongoDB] Default journal found!`));

    console.log(colors.green(`[APP] Post-It API by Hershraj & Alex started up with no errors!`));
    console.log(`_______________`);
}).catch(() => {
    console.error(colors.red(`[MongoDB] ERROR - COULDN'T CONNECT TO MONGODB - SHUTTING DOWN`));
    process.exit(1);
});

runMediaServer(`media`); // The media path

// Make sure Azure finds port 8080 in PROD mode!
let portToUse = parseInt(process.env.PORT) || 8080;
console.log(colors.green(`[APP] Env port: ${process.env.PORT}, Config port: ${config.devMode ? config.devPort : config.prodPort}`));
app.listen(portToUse, () => {
    console.log(colors.green(`[APP] App listening on port ${portToUse}`));
});