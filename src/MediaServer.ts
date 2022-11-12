// Import first party modules
import {User} from './models/User.model';
import {Journal} from './models/Journal.model';
import {app, uptimestart} from './index';
import {FileManager} from './modules/FileManager';
import {join} from 'path';
import fs from 'fs';
import { config } from './config';

let fManagerPath = join(`${__dirname}`, `../`, `./uploads`);
let fileManager = new FileManager(fManagerPath);

export function runMediaServer(serverPath: string): void {
    console.log(`[MEDIA SERVER] Starting Media Server...`);

    app.get(`/${serverPath}/uptime`, async (req, res) => {
        res.send(`Uptime: ${Math.floor((Date.now() - uptimestart)/(1000 * 60))} Minutes`);
    });

    app.get(`/${serverPath}/uploads/:fileType/:userid/:postid`, async (req, res) => { // Extension will be json or svg
        let postExists = await fileManager.checkPostExists(req.params.userid, req.params.postid);

        if (!(req.params.fileType == `json` || req.params.fileType == `svg` || req.params.fileType == `preview`)) {
            res.status(404);
            return res.send(`ERROR: Improper Request!`);
        }
        let outputFileType = req.params.fileType === `preview` ? `-preview.svg` : `.${req.params.fileType}`;

        if (!postExists) {
            res.status(404);
            return res.send(`ERROR: File does not exist!`);
        }

        // Wait... why does this not work properly -- Oh well!
        let j: any = await Journal.findOne({id: req.params.postid}) || null;

        if (j?.visibility !== `private` ||! j) return res.sendFile(`${fileManager.path}/${req.params.userid}/${req.params.postid}${outputFileType}`);

        if (typeof req.headers.authorization !== `string`) {
            res.status(401);
            return res.send(`ERROR: Unauthorized!`);
        }

        let token = req.headers.authorization.replace(`Bearer `, ``);
        let u: any = User.findOne({token: token}) || null;

        if (!u) {
            res.status(401);
            return res.send(`ERROR: Improper Token!`);
        }

        // Gotta add security check
        if (j?.visibility == `private` && j?.authorID !== u.id) {
            res.status(403);
            return res.send(`ERROR: You do not have permission to access this journal!`);
        }

        return res.sendFile(`${fileManager.path}/${req.params.userid}/${req.params.postid}${outputFileType}`);
    });

    /*
        What the API is expecting:
        - header authorization token
        - params JournalID and UserID
    */
    app.delete(`/${serverPath}/delete/:userid/:postid`, async (req, res) => {
        if (typeof req.headers.authorization !== `string`) {
            res.status(401);
            return res.send(`ERROR: Unauthorized!`);
        }
        let token = req.headers.authorization.replace(`Bearer `, ``);
        let postExists = await fileManager.checkPostExists(req.params.userid, req.params.postid);
        if (!postExists) {
            res.status(404);
            return res.send(`ERROR: File does not exist!`);
        }

        let authUser = await User.findOne({token: token, id: req.params.userid}) || null;
        if (!authUser) {
            res.status(401);
            return res.send(`ERROR: Unauthorized!`);
        }
        let journalToDel = await Journal.findOne({authorID: authUser.id, id: req.params.postid}) || null;
        if (!journalToDel) {
            res.status(401);
            return res.send(`ERROR: Journal not found on DB!`);
        }

        await Journal.deleteOne({authorID: authUser.id, id: req.params.postid});
        await fileManager.deletePost(req.params.userid, req.params.postid);
    });

    // What the api expects
    /*
        Token Auth in Header
        req.body = {
            "userID": "userID",
            "journalID": "journalID",
            "json": "{STRINGIFIED JSON DATA THAT CAN BE PUT INTO A .json FILE!}"",
            "svg": "ENCODED URI COMPONENT SVG DATA THAT CAN BE PUT INTO A .svg FILE!"
        }
    */

    app.get(`/${serverPath}/:secret/:userID/list`, async(req, res) => {
        if (req.params.secret !== config.secret) return;
        let returnStr = ``;
        try {
            fs.readdirSync(fManagerPath + `/${req.params.userID}`).forEach(file => {
                if(!file.endsWith(`.svg`)) return;
                returnStr += file.replace(`.svg`, ``) + `\n`;
            });
        } catch {
            null;
        }
        return res.send(returnStr);
    });

    app.post(`/${serverPath}/upload`, async (req, res) => {
        if (typeof req.headers.authorization !== `string`) {
            res.status(401);
            return res.send(`ERROR: Unauthorized!`);
        }
        let token = req.headers.authorization.replace(`Bearer `, ``);
        let authUser = await User.findOne({token: token});
        if (authUser == null || (authUser.id !== req.body.userID)) {
            res.status(401);
            return res.send(`ERROR: Unauthorized!`);
        }

        if (!req.body.userID ||! req.body.journalID ||! req.body.json ||! req.body.svg ||! req.body.previewSvg) {
            res.status(400);
            return res.send(`ERROR: Invalid Syntax!`);
        }

        if (typeof req.body.userID !== `string` || typeof req.body.journalID !== `string` || typeof req.body.json !== `string` || typeof req.body.previewSvg !== `string`) {
            res.status(400);
            return res.send(`ERROR: Invalid Value Types!`);
        }

        await fileManager.makePost(req.body.userID, req.body.journalID, {
            "postJSON": req.body.json,
            "postSVG": decodeURIComponent(req.body.svg),
            "postPreviewSVG": decodeURIComponent(req.body.previewSvg)
        });
        res.status(201);
        return res.send(true);
    });
}