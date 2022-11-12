/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import {randomString} from '../modules/Generator';

// Ratings are an array of an array
// ratings: [[<string> userID, <int> theirRating], ...]
let JournalSchema = new mongoose.Schema({
    title: {type: String, reqiured: true, default: `Untitled`},
    timestampCreated: {type: Number, required: true, default: Date.now()},
    id: {type: String, required: true, default: randomString(12)},
    authorID: {type: String, required: true, default: `none`},
    topics: {type: Array, required: true, default: []},
    bookmarks: {type: Array, required: true, default: []},
    visibility: {type: String, required: true, default: `public`}, // Public, Private, Unlisted
    remixInfo: {
        "allow-remix": {type: Boolean, required: true, default: true},
        "is-remix": {type: Boolean, required: true, default: false},
        "original-journal-id": {type: String, required: true, default: `0`},
        "remixes": {type: Number, required: true, default: 0},
        "remix-chain": {type: Number, required: true, default: 0}
    },
    pages: {type: Number, required: true, default: 1},
    comments: {type: Array, required: true, default: []},
    isDraft: {type: Boolean, required: true, default: false},
    rating: {type: Array, required: true, default: []}
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
    let userHasRated = false;
    let ourPrevRating = -1;
    for (let i = 0; i < 6; i++) { // This should loop from 0 to 5... I think>????? am stupid rn
        if(JournalInfo.rating.includes([requestUserId, i])) {
            ourPrevRating = i;
            userHasRated = true;
        }
    }

    return {
        "title": JournalInfo.title,
        "timestampCreated": JournalInfo.timestampCreated,
        "id": JournalInfo.id,
        "authorID": JournalInfo.authorID,
        "topics": JournalInfo.topics,
        "likes": JournalInfo.bookmarks.length || 0,
        "remixInfo": JournalInfo.remixInfo,
        "pages": JournalInfo.pages,
        "visibility": JournalInfo.visibility,
        "comments": JournalInfo.comments.length || 0,
        "content": JournalInfo.content,
        "isDraft": JournalInfo.isDraft,
        "bookmarks": JournalInfo.bookmarks ? JournalInfo.bookmarks.includes(requestUserId) : false,
        "authenticated": JournalInfo.authorID === requestUserId,
        "rating": userHasRated ? ourPrevRating : -1, // This will return the user's personal rating of the journal
        "avgRating": getJournalAverageRating(JournalInfo)
    };
}

export function getJournalAverageRating(journal: any): number {
    // Calculate the average ratings
    let sum = 0;
    let l = 0;
    journal.rating.forEach(rating => {
        sum += parseInt(rating[1]);
        l++;
    });
    if (l == 0) l += 1; // Prevent division by zero lol
    return sum / l;
}