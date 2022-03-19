/* eslint-disable @typescript-eslint/explicit-function-return-type */
import express from 'express';
import {User} from '../../models/User.model';
import { Journal, filterJournal } from '../../models/Journal.model';

/*
    What the API is expecting:
    req.body = {
        "sort": "top" OR "new",
        "fields": [] "tags" OR/AND "usernames" OR/AND "journals",
        "query": "thing to query",
        "page": 0 // start at 0, go to 1, 2, etc.,
        "remix": "true" / "false" / "only" // YES THIS IS A STRING, IT IS LIKE THAT ON PURPOSE
    }

    What the API will return
    {
        "results": [this will contain a lot of journals ideally],
        "success": true
    }
*/


export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(req.body.sort === undefined ||
        req.body.fields === undefined ||
        req.body.query === undefined ||
        req.body.page === undefined ||
        req.body.remix === undefined){
        return res.send(`ERROR: Bad syntax!`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    let user = token ? await User.findOne({'token': token}) : null;


    let responseArr = [];
    let regex = new RegExp(req.body.query, `i`);

    async function fetchTaggedByQuery(){
        return await Journal.find({isDraft: false, visibility: `public`, topics: {$all : [req.body.query]}});
    }

    async function fetchUsernamesByQuery(){
        let usersWithQuery = await (await User.find({username: {$regex: regex}})).map(x => x.id);
        return await Journal.find({isDraft: false, visibility: `public`, authorID: {$in: usersWithQuery}}).then(async (finalJ) => {
            return finalJ;
        });
    }

    async function fetchJournalsByQuery(){
        let jj;
        if(req.body.remix == `false`) jj = (await Journal.find({isDraft: false, visibility: `public`, title: {$regex: regex}})).filter(a => a.remixInfo[`is-remix`] == false);
        if(req.body.remix == `only`) jj = (await Journal.find({isDraft: false, visibility: `public`, title: {$regex: regex}})).filter(a => a.remixInfo[`is-remix`] == true);
        else jj = await Journal.find({isDraft: false, visibility: `public`, title: {$regex: regex}});
        return jj;
    }

    let asyncFunctions = [];

    if(req.body.fields.includes(`tags`)){
        asyncFunctions.push(fetchTaggedByQuery());
    }
    if(req.body.fields.includes(`usernames`)){
        asyncFunctions.push(fetchUsernamesByQuery());
    }
    if(req.body.fields.includes(`journals`)){
        asyncFunctions.push(fetchJournalsByQuery());
    }

    await Promise.all(asyncFunctions).then(async (results) => {
        responseArr = responseArr.concat(results.flat());

        if(req.body.sort == `top`){
            responseArr.sort((a, b) => {return b.likes.length - a.likes.length;});
        }
        else {
            responseArr.sort((a, b) => {return b.timestampCreated - a.timestampCreated;});
        }

        let PagOffset = parseInt(req.body.page); // 0, 1, 2
        let finalArr = responseArr.slice((9 * PagOffset), (9 * (PagOffset + 1)));

        return res.json({
            "results": finalArr.map(x => filterJournal(x, user ? user.id : `0`)),
            "success": true
        });
    });
}