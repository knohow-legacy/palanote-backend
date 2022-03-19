import express from 'express';
import {User} from '../../models/User.model';

// You need to have a token for this
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

    let FollowingUsers = await User.find({followers: {$all : [UserInfo.id]}});

    let returnArr = [];

    FollowingUsers.forEach(AAInfo => {
        if(AAInfo.id == UserInfo.id) return;
        returnArr.push({
            username: AAInfo.username,
            timestampCreated: AAInfo.timestampCreated,
            id: AAInfo.id,
            pfp: AAInfo.pfp,
            followedTopics: AAInfo.followedTopics,
            followers: AAInfo.followers.length,
            comments: AAInfo.comments
        });
    });

    return res.json({
        success: true,
        data: returnArr
    });
}

export let params = 0;