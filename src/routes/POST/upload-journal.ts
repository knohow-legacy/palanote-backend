import express from 'express';
import {User} from '../../models/User.model';
import {Journal} from '../../models/Journal.model';
import {randomString} from '../../Generator';

/*
    What the API is expecting:
    req.body = {
        "title": "JournalTitle",
        "topics": [insert, topics, here, or, leave, as, empty, array],
        "remixInfo": { // Fill in this data with what u need!
            "allow-remix": true, // User should be able to toggle this setting
            "is-remix": false, // Self-explanatory
            "original-journal-id": null, // Put original Journal ID here
            "remixes": 0,
            "remix-chain": 0 // If this is a remix of an OG Journal, put 1 here. If it is a remix of a remix, put 2 and so on
        },
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
        res.status(400);
        return res.send(`ERROR: Something went wrong!`);
    }

    if (typeof req.headers.authorization !== `string`) {
        res.status(401);
        return res.send(`ERROR: Unauthorized!`);
    }
    let token = req.headers.authorization.replace(`Bearer `, ``);

    if(!token){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid User Token`);
    }

    if(req.body.isDraft === undefined ||
        req.body.title === undefined ||
        req.body.topics === undefined ||
        req.body.remixInfo === undefined ||
        req.body.content === undefined ||
        req.body.visibility === undefined){
        res.status(400);
        return res.send(`ERROR: Bad syntax!`);
    }

    let JournalingUser = await User.findOne({token: token}) || null;
    if(!JournalingUser){
        res.status(400);
        return res.send(`ERROR: Invalid Token!`);
    }

    let TheJournal = new Journal({
        title: req.body.title,
        topics: req.body.topics,
        remixInfo: req.body.remixInfo,
        content: req.body.content,
        authorID: JournalingUser.id,
        id: randomString(12),
        visibility: req.body.visibility,
        comments: [],
        isDraft: req.body.isDraft
    });

    if (TheJournal.remixInfo[`original-journal-id`]) {
        let RemixedJournal = await Journal.findOne({id: TheJournal.remixInfo[`original-journal-id`]}) || null;
        if (RemixedJournal) {
            console.log(`is remix, incrementing`);
            RemixedJournal.remixInfo.remixes += 1;
            console.log(RemixedJournal.remixInfo.remixes);
            await RemixedJournal.save();
        }
    }
    await TheJournal.save();

    res.status(200);

    console.log(`success`);

    return res.json({
        "success": true,
        "JournalID": TheJournal.id
    });
}