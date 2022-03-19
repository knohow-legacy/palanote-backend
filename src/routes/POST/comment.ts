import express from 'express';
import {User} from '../../models/User.model';
import {Journal} from '../../models/Journal.model';
import { randomString } from '../../Generator';

/*
    What the API is expecting:
    req.body = {
        "journalID": "journalID",
        "comment": "String of text to leave as a comment"
    }

    What the API will return
    {
        "success": true
    }
*/

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.body){
        return res.send(`ERROR: Something went wrong!`);
    }

    if(! req.body.journalID ||! req.body.comment){
        return res.send(`ERROR: Bad syntax!`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }
    if(!token){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid User Token`);
    }

    let UserObj = await User.findOne({token: token}) || null;
    let JournalObj = await Journal.findOne({id: req.body.journalID});
    if(!UserObj ||! JournalObj){
        return res.send(`ERROR: Invalid User or Journal!`);
    }

    JournalObj.comments.push({
        "user": UserObj.id,
        "content": req.body.comment,
        "pinned": false,
        "heart": false,
        "timestamp": Date.now(),
        "id": randomString(12)
    });

    UserObj.comments.push({
        "journal": JournalObj.id,
        "content": req.body.comment,
        "timestamp": Date.now(),
        "id": randomString(12)
    });

    // Oldest comments first
    JournalObj.comments.sort((a, b) => {
        return a.timestamp - b.timestamp;
    });

    // Newest comments first in the User Object
    UserObj.comments.sort((a, b) => {
        return b.timestamp - a.timestamp;
    });

    await JournalObj.save();
    await UserObj.save();

    return res.json({
        "success": true
    });
}