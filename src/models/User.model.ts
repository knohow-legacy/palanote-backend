import mongoose from 'mongoose';
import {randomString} from '../Generator';

let UserSchema = new mongoose.Schema({
    username: {type: String, reqiured: true, default: `Default`},
    timestampCreated: {type: Number, required: true, default: Date.now()},
    id: {type: String, required: true, default: randomString(10)},
    token: {type: String, required: true},
    pfp: {type: String, required: true, default: `none`},
    followedTopics: {type: Array, required: true, default: []},
    followers: {type: Array, required: true, default: []},
    comments: {type: Array, required: true, default: []}
}, { collection: `users` });

export let User = mongoose.model(`User`, UserSchema);