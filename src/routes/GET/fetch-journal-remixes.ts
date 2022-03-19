/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import {User} from '../../models/User.model';
import { Journal, filterJournal } from '../../models/Journal.model';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.params.var1){
        res.status(404);
        return res.send(`Error: Invalid JournalID`);
    }
    if(!req.params.var2){
        res.status(404);
        return res.send(`Error: Invalid Offset`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    let user = token ? await User.findOne({'token': token}) : null;

    res.status(200);
    let JournalTHING = (await Journal.find({remixInfo: {"original-journal-id": req.params.var1}, visiblity: `public`, isDraft: false}) || [])
        .map(JournalInfo => filterJournal(JournalInfo, user.id || `0`))
        .sort((a, b) => {return (<any> b).timestampCreated - (<any> a).timestampCreated;});
    let PagOffset = parseInt(req.params.var2); // 0, 1, 2
    let pgArray = JournalTHING.slice((5 * PagOffset), (5 * (PagOffset + 1)));
    return res.json(pgArray);
}

export let params = 2;