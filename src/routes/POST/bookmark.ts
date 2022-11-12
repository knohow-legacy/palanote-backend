import express from 'express';
import {User} from '../../models/User.model';
import {Journal} from '../../models/Journal.model';
import { config } from '../../config';

// This will SWITCH the type from what the previous value is. If the entry is not present, it will be added. If it is present, it will be deleted. This works for both following and unfollowing in that way
/*
    What the API is expecting:
    req.body = {
        "journalID": "JournalID To switch from like to not / not to like",
    }

    What the API will return
    {
        "isNowBookmarked": true / false
        "success": true
    }
*/


export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.body){
        return res.send(`ERROR: Something went wrong!`);
    }

    if(! req.body.journalID){
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

    if((JournalObj.authorID == UserObj.id) &&! config.devMode){
        return res.send(`ERROR: You cannot like a journal that you created!`);
    }

    let isLiked = false;
    if(JournalObj.bookmarks.includes(UserObj.id)){
        if(JournalObj.bookmarks.length <= 1) JournalObj.bookmarks = [];
        else {
            let index = JournalObj.bookmarks.indexOf(UserObj.id);
            JournalObj.bookmarks.splice(index, 1);
            isLiked = false;
        }
    } else {
        JournalObj.bookmarks.push(UserObj.id);
        isLiked = true;
    }
    await JournalObj.save();

    return res.json({
        isNowBookmarked: isLiked,
        success: true
    });
}