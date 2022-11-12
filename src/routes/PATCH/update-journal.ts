import express from 'express';
import {User} from '../../models/User.model';
import {Journal} from '../../models/Journal.model';
/*
    What the API is expecting:
    req.body = {
        "journalID": "Id of the Journal To Update",
        "title": "JournalTitle",
        "topics": [insert, topics, here, or, leave, as, empty, array],
        "content": {
            // IDK WHAT IS IN HERE, FIGURE IT OUT
        },
        "isDraft": true / false,
        "visibility": "public" // Public, Private, or Unlisted
    }

    What the API will return
    {
        "JournalID": JournalID,
        "success": true
    }
*/

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.body){
        return res.send(`ERROR: Something went wrong!`);
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

    if(req.body.isDraft === undefined ||
        req.body.title === undefined ||
        req.body.topics === undefined ||
        // req.body.content === undefined ||
        req.body.visibility === undefined ||
        req.body.journalID === undefined){
        return res.send(`ERROR: Bad syntax!`);
    }

    let JournalingUser = await User.findOne({token: token}) || null;
    if(!JournalingUser){
        return res.send(`ERROR: Invalid Token!`);
    }

    let TheJournal = await Journal.findOne({id: req.body.journalID}) || null;
    if(!TheJournal){
        return res.send(`ERROR: Invalid Journal!`);
    }

    if(TheJournal.authorID !== JournalingUser.id){
        return res.send(`ERROR: You do not own this Journal!`);
    }

    TheJournal.title = req.body.title;
    TheJournal.topics = req.body.topics;
    // TheJournal.content = req.body.content;
    TheJournal.visibility = req.body.visibility;
    TheJournal.isDraft = req.body.isDraft;

    TheJournal.save();
    return res.json({
        "success": true,
        "JournalID": TheJournal.id
    });
}