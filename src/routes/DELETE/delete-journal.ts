import express from 'express';
import {Journal} from '../../models/Journal.model';
import {User} from '../../models/User.model';

/*
    What the API is expecting:
    - header authorization token
    - params journalID

    What the API will return
    {
        "success": true
    }
*/

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if (typeof req.headers.authorization !== `string`) {
        res.status(401);
        return res.send(`ERROR: Unauthorized!`);
    }
    let token = req.headers.authorization.replace(`Bearer `, ``);

    if(!req.params.var1){
        res.status(400);
        return res.send(`ERROR: Bad syntax!`);
    }

    let JournalingUser = await User.findOne({token: token}) || null;
    if(!JournalingUser){
        res.status(404);
        return res.send(`ERROR: Invalid Token!`);
    }

    let TheJournal = await Journal.findOne({id: req.params.var1}) || null;
    if(!TheJournal){
        res.status(404);
        return res.send(`ERROR: Invalid Journal!`);
    }

    if(TheJournal.authorID !== JournalingUser.id){
        res.status(401);
        return res.send(`ERROR: You do not own this Journal!`);
    }

    if (TheJournal.remixInfo[`original-journal-id`]) {
        let RemixedJournal = await Journal.findOne({id: TheJournal.remixInfo[`original-journal-id`]}) || null;
        if (RemixedJournal) {
            RemixedJournal.remixInfo[`remixes`] -= 1;
            await RemixedJournal.save();
        }
    }

    await Journal.deleteOne({id: req.params.var1});
    return res.json({
        "success": true
    });
}

export let params = 1;