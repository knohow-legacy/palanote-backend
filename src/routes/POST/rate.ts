import express from 'express';
import {User} from '../../models/User.model';
import {Journal, getJournalAverageRating} from '../../models/Journal.model';

// This will SWITCH the type from what the previous value is. If the entry is not present, it will be added. If it is present, it will be deleted. This works for both following and unfollowing in that way
/*
    What the API is expecting:
    req.body = {
        "journalID": "JournalID To switch from like to not / not to like",
        "rating": [number between 0 and 5 | -1]
    }

    What the API will return
    {
        "newUserRating": <number>,
        "newAverageRating": <number>,
        "success": <boolean>
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

    if (typeof req.body?.rating !== `number` || req.body?.rating > 5 || req.body?.rating < -1) {
        return res.send(`ERROR: Invalid Rating!`);
    }

    let ourPrevRating = -1;
    let userHasRated = false;
    for (let i = 0; i < 6; i++) { // This should loop from 0 to 5... I think>????? am stupid rn
        if(JournalObj.rating.includes([UserObj.id, i])) {
            ourPrevRating = i;
            userHasRated = true;
        }
    }

    if (userHasRated  && req.body.rating !== -1) { // Update the rating
        JournalObj.rating[JournalObj.rating.indexOf([UserObj.id, ourPrevRating])] = [UserObj.id, req.body.rating];
    } else if (userHasRated && req.body.rating == -1){ // remove the rating
        let indexToRemove =  JournalObj.rating.indexOf([UserObj.id, ourPrevRating]);
        JournalObj.rating.splice(indexToRemove, 1); // Remove the item
    } else { // Add the rating -- It never existed from this user
        JournalObj.rating.push([UserObj.id, req.body.rating]);
    }
    await JournalObj.save();

    return res.send({
        "newUserRating": req.body.rating,
        "newAverageRating": getJournalAverageRating(JournalObj),
        "success": true
    });
}