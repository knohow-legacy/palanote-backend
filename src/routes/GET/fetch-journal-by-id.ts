import express from 'express';
import { Journal, filterJournal } from '../../models/Journal.model';
import { User } from '../../models/User.model';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.params.var1){
        res.status(404);
        return res.send(`Error: Invalid JournalID`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    let JournalInfo = await Journal.findOne({'id': req.params.var1}) || null;
    let user = token ? await User.findOne({'token': token}) : null;
    let authenticated = (JournalInfo && user) && user.id === JournalInfo.authorID;

    if(!JournalInfo || (JournalInfo.visibility === `private` && authenticated)){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid JournalID`);
    }
    else {
        res.status(200);
        return res.json(filterJournal(JournalInfo, user.id || 0));
    }
}

export let params = 1;