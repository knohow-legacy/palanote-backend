import express from 'express';
import {User} from '../../models/User.model';

// This will SWITCH the type from what the previous value is. If the entry is not present, it will be added. If it is present, it will be deleted. This works for both following and unfollowing in that way
/*
    What the API is expecting:
    req.body = {
        "follow-type": "user" OR "topic",
        "data-entry": "userID to follow" OR "topic name to follow"
    }

    What the API will return
    {
        "isNowFollowed": true / false,
        "user": The New Updated User Object
    }
*/

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.body){
        return res.send(`ERROR: Something went wrong!`);
    }

    if(! req.body[`follow-type`] ||! req.body[`data-entry`]){
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

    let allowedFollowTypes = [`user`, `topic`];
    if(!allowedFollowTypes.includes( req.body[`follow-type`])){
        return res.send(`ERROR: Bad Follow Type!`);
    }

    let FollowType = req.body[`follow-type`];
    let InitialData = req.body[`data-entry`];


    let UserInfo = await User.findOne({'token': token}) || null;
    if(!UserInfo){
        res.status(404);
        return res.send(`Error: Invalid Token`);
    }

    let IsNowFollowed = false;
    if(FollowType == `user`){
        let UserToFollow = await User.findOne({'id': InitialData}) || null;
        if(!UserToFollow){
            res.status(404);
            return res.send(`Error: Invalid User to Follow!`);
        }
        if(UserToFollow.followers.includes(UserInfo.id)){
            // Remove It
            if(UserToFollow.followers.length <= 1) UserToFollow.followers = [];
            else {
                let index = UserToFollow.followers.indexOf(UserInfo.id);
                UserToFollow.followers.splice(index, 1);
            }
            IsNowFollowed = false;
        }
        else {
            UserToFollow.followers.push(UserInfo.id);
            IsNowFollowed = true;
        }
        await UserToFollow.save();
    }
    else if(FollowType == `topic`) {
        if(UserInfo.followedTopics.includes(InitialData)){
            // Remove It
            if(UserInfo.followedTopics.length <= 1) UserInfo.followedUsers = [];
            else {
                let index = UserInfo.followedTopics.indexOf(InitialData);
                UserInfo.followedTopics.splice(index, 1);
            }
            IsNowFollowed = false;
        }
        else {
            UserInfo.followedTopics.push(InitialData);
            IsNowFollowed = true;
        }
    }

    await UserInfo.save();
    return res.json({
        isNowFollowed: IsNowFollowed
    });
}