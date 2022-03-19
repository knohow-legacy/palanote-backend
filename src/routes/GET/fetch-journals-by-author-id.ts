/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import {User} from '../../models/User.model';
import { Journal, filterJournal } from '../../models/Journal.model';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.params.var1){
        res.status(404);
        return res.send(`Error: Invalid UserID`);
    }
    if(!req.params.var2){
        res.status(404);
        return res.send(`Error: Invalid Offset`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    let UserInfo = null;
    if (req.params.var1 === `me` && token) {
        UserInfo = await User.findOne({'token': token}) || null;
    } else {
        UserInfo = await User.findOne({'id': req.params.var1}) || null;
    }

    if(!UserInfo){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid UserID`);
    }
    else {
        let authenticated = UserInfo && UserInfo.token === token;

        res.status(200);
        let JournalTHING = (await Journal.find(authenticated ? {authorID: UserInfo.id} : {authorID: UserInfo.id, visiblity: `public`, isDraft: false}) || []).map(JournalInfo => filterJournal(JournalInfo, UserInfo.id)).sort((a, b) => {return (<any> b).timestampCreated - (<any> a).timestampCreated;});
        let PagOffset = parseInt(req.params.var2); // 0, 1, 2
        let pgArray = JournalTHING.slice((5 * PagOffset), (5 * (PagOffset + 1)));
        return res.json(pgArray);
    }
}

export let params = 2;