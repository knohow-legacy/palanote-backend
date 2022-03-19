import express from 'express';
import {User} from '../../models/User.model';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.params.var1){
        res.status(404);
        return res.send(`Error: Invalid UserID`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    let requestUser = await User.findOne({'token': token}) || null;
    let UserInfo = null;
    if (req.params.var1 === `me` && token) {
        UserInfo = requestUser;
    } else {
        UserInfo = await User.findOne({'id': req.params.var1}) || null;
    }

    if(!UserInfo){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid UserID`);
    }
    else {
        res.status(200);
        return res.json({
            username: UserInfo.username,
            timestampCreated: UserInfo.timestampCreated,
            id: UserInfo.id,
            pfp: UserInfo.pfp,
            followedTopics: UserInfo.followedTopics,
            followers: UserInfo.followers.length,
            comments: UserInfo.comments,
            bio: UserInfo.bio,
            authenticated: token && UserInfo.token === token,
            isFollowing: requestUser && UserInfo.followers.includes(requestUser.id)
        });
    }
}

export let params = 1;