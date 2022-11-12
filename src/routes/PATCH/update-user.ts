import express from 'express';
import {User} from '../../models/User.model';
/*
    What the API is expecting:
    req.body = {
        "bio": "new user bio (or the old one if they have not changed it at all)" | null,
        "username": "newusername" | null,
        "pfp": "newPFPString" | null
    }

    What the API will return
    {
        "success": true
    }
*/

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.body){
        return res.send(`ERROR: Something went wrong!`);
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

    let UserToUpdate = await User.findOne({token: token}) || null;
    if(!UserToUpdate){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid User Token - User doesn't exist!`);
    }

    // Update stuff
    if(req.body?.bio) UserToUpdate.bio = req.body.bio;
    if(req.body?.username) UserToUpdate.username = req.body.username;
    if(req.body?.pfp) UserToUpdate.pfp = req.body.pfp;

    await UserToUpdate.save();
    return res.json({success: true});
}