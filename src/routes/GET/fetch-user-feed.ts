import express from 'express';
import {User} from '../../models/User.model';
import { Journal, filterJournal } from '../../models/Journal.model';

// You need to have a token for this
// Arg 1 is the pagination offset!
export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }
    if(!token){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid User Token`);
    }
    let UserInfo = await User.findOne({'token': token}) || null;
    if(!UserInfo){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid User Token`);
    }

    let feed = [];

    // First get Journals involving followed topics
    let rawTopics = [];
    if(UserInfo.followedTopics > 0) UserInfo.followedTopics.forEach(async followedTopic => {
        let arrTopics = (await Journal.find({isDraft: false, visibility: `public`, topics: {$all : [followedTopic]}}));
        if(arrTopics.length > 0){
            arrTopics.forEach(elem => {
                rawTopics.push(filterJournal(elem, UserInfo.id));
            });
        }
    });


    let rawUsers = [];
    // Then get Journals involving followed users
    let FollowingUsers = await User.find({followers: {$all : [UserInfo.id]}});
    if(FollowingUsers.length > 0) FollowingUsers.forEach(async followedUser => {
        let arrUsers = (await Journal.find({isDraft: false, visibility: `public`, authorID: `${followedUser.id}`}));
        if(arrUsers.length > 0){
            arrUsers.forEach(elem => {
                rawUsers.push(filterJournal(elem, UserInfo.id));
            });
        }
    });

    feed = rawTopics.concat(rawUsers);

    // If feed is too small, just fill up with most recent Journals
    if(feed.length < 2){
       let rawJournals = ((await Journal.find({isDraft: false, visibility: `public`})) || null);
       rawJournals.forEach(raw => {
           feed.push(filterJournal(raw, UserInfo.id));
       });
    }

    // Feed is always sorted by recency!
    feed = feed.sort((a, b) => {return b.timestampCreated - a.timestampCreated;});

    let PagOffset = parseInt(req.params.var1); // 0, 1, 2
    let pgArray = feed.slice((5 * PagOffset), (5 * (PagOffset + 1)));
    return res.json(pgArray);
}

export let params = 1;