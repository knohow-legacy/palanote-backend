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
    if(!req.params.var3){
        res.status(404);
        return res.send(`Error: Invalid Sorting Option`);
    }
    if(!req.params.var4){
        res.status(404);
        return res.send(`Error: Invalid Remix Option`); // true, false, only
    }

    let sort = req.params.var3.toLowerCase();
    let validSorts = [`top`, `new`];

    let allowRemixes = req.params.var4.toLowerCase();
    let validRemixOptions = [`true`, `false`, `only`];

    if(!validSorts.includes(sort)){
        res.status(404);
        return res.send(`Error: Invalid Sorting Option`);
    }

    if(!validRemixOptions.includes(allowRemixes)){
        res.status(404);
        return res.send(`Error: Invalid Remix Option`); // true, false, only
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
        let JournalTHING = (await Journal.find(authenticated ? {authorID: UserInfo.id} : {authorID: UserInfo.id, visiblity: `public`, isDraft: false}) || []).map(JournalInfo => filterJournal(JournalInfo, UserInfo.id));

        if(allowRemixes == `only`){
            await JournalTHING.filter(a => (<any> a).remixInfo[`is-remix`] == true);
        }
        else if(allowRemixes == `false`){
            await JournalTHING.filter(a => (<any> a).remixInfo[`is-remix`] == false);
        }

        if(sort == `new`){
            await JournalTHING.sort((a, b) => {return (<any> b).timestampCreated - (<any> a).timestampCreated;});
        }
        else if(sort == `top`){
            await JournalTHING.sort((a, b) => {return (<any> b).likes - (<any> a).likes;});
        }
        let PagOffset = parseInt(req.params.var2); // 0, 1, 2
        let pgArray = JournalTHING.slice((5 * PagOffset), (5 * (PagOffset + 1)));
        return res.json(pgArray);
    }
}

export let params = 4;