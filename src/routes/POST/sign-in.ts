import express from 'express';
import { User } from '../../models/User.model';
import axios from 'axios';

// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

function parseJwt(token:string) : object | null {
    try {
        return JSON.parse(atob(token.split(`.`)[1]));
    } catch (e) {
        return null;
    }
}

/*
    This end point signs the user in, creating a new user if they do not previously exist.
    Then, it returns their user details.

    What the API is expecting:
    req.headers.authorization: the user's google id token

    What it will return
    {
        success: true,
        user: User instance
    }
*/


export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(typeof req.headers.authorization !== `string`){
        res.status(400);
        return res.send({success: false, error: `No authorization header found!`});
    }

    let authCode = req.headers.authorization.replace(`Bearer `, ``);

    let resp = await axios.post(`https://www.googleapis.com/oauth2/v4/token`, {
            grant_type: `authorization_code`,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `postmessage`,
            code: authCode
        },
        {
            headers: {
                "Content-Type": `application/json`
            }
        }
    ).catch(err => {
        console.error(err.response);
        res.status(500);
        res.send({success: false, error: `${err.response.data.error} - ${err.response.data.error_description}`});
    });

    if (!resp || resp.status !== 200) return;

    const payload = parseJwt(resp.data.id_token);

    const userid = payload[`sub`];

    let user = await User.findOne({id: userid});
    if(!user){
        user = new User({
            "username": (<string> payload[`name`]).substring(0, 32),
            "pfp": payload[`picture`] || `none`,
            "id": userid,
            "token": resp.data.refresh_token
        });
    }

    user.token = resp.data.refresh_token;
    user.save();

    res.status(200);

    // Return the user instance
    return res.json({
        success: true,
        token: resp.data.refresh_token,
        userID: user.id
    });
}