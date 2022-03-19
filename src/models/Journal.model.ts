import mongoose from 'mongoose';
import {randomString} from '../Generator';

let JournalSchema = new mongoose.Schema({
    title: {type: String, reqiured: true, default: `Untitled`},
    content: {type: Object, required: true, default: {"data": null}},
    timestampCreated: {type: Number, required: true, default: Date.now()},
    id: {type: String, required: true, default: randomString(12)},
    authorID: {type: String, required: true, default: `none`},
    topics: {type: Array, required: true, default: []},
    likes: {type: Array, required: true, default: []},
    visibility: {type: String, required: true, default: `public`}, // Public, Private, Unlisted
    remixInfo: {type: Object, required: true, default: {"allow-remix": true, "is-remix": false, "original-journal-id": null, "remixes": 0, "remix-chain": 0}},
    comments: {type: Array, required: true, default: []},
    isDraft: {type: Boolean, required: true, default: false}
}, { collection: `journals` });

export let Journal = mongoose.model(`Journal`, JournalSchema);

/**
 * Formats journals in a standard format that can be shown publically.
 * @param journalInfo - The journal to format
 * @param authenticated - A boolean representing whether the request is authenticated or not. This means
 *      that the user is logged in and has access to edit and delete the journal.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterJournal(JournalInfo: any, requestUserId:string) : object {
    return {
        "title": JournalInfo.title,
        "timestampCreated": JournalInfo.timestampCreated,
        "id": JournalInfo.id,
        "authorID": JournalInfo.authorID,
        "topics": JournalInfo.topics,
        "likes": JournalInfo.likes.length || 0,
        "remixInfo": JournalInfo.remixInfo,
        "visibility": JournalInfo.visibility,
        "comments": JournalInfo.comments.length || 0,
        "content": JournalInfo.content,
        "isDraft": JournalInfo.isDraft,
        "isLiked": JournalInfo.likes ? JournalInfo.likes.includes(requestUserId) : false,
        "authenticated": JournalInfo.authorID === requestUserId
    };
}
