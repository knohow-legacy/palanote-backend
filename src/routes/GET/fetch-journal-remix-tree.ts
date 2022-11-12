/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from '../../config';
import express from 'express';
import { Journal } from '../../models/Journal.model';
import { User } from '../../models/User.model';

interface JournalTreeObj {
    children: JournalTreeObj[],
    data: any
}

interface JournalTreeNoChildYet {
    data: any
}

async function asyncForEach<T>(array:T[], callback:any): Promise<void> {
    for(let index = 0; index<array.length; index++){
        await callback(array[index], index, array);
    }
}

function normalizeMongoDoc(doc: any): any {
    let d = JSON.parse(JSON.stringify(doc.toObject()));
    delete d[`__v`];
    delete d[`_id`];
    return d;
}

async function getRootNode(journalStartID: string): Promise<JournalTreeNoChildYet> {
    let thisJournal = await Journal.findOne({id: journalStartID}) || null;
    let thisJournalObj = {
        data: thisJournal
    };
    if (!thisJournal) return thisJournalObj;
    if(thisJournal.remixInfo[`is-remix`]) {
        return await getRootNode(thisJournal.remixInfo[`original-journal-id`]);
    } else {
        return thisJournalObj;
    }
}

async function addChildren(rootNode: JournalTreeNoChildYet, reqUserID: string): Promise<JournalTreeObj> {
    let formatDoc = normalizeMongoDoc(rootNode.data);
    delete formatDoc[`content`];
    delete formatDoc[`comments`];
    return {
        data: formatDoc,
        children: await getChildrenArr(rootNode, reqUserID)
    };
}

async function getChildrenArr(node: JournalTreeNoChildYet, reqUserID: string): Promise<JournalTreeObj[]> {
    let thisJournalsChildren = await Journal.find({"remixInfo.original-journal-id": node.data.id, "visibility": `public`});
    if(thisJournalsChildren?.length == 0 ||! thisJournalsChildren) return [];
    else {
        let returnArr = [];
        await asyncForEach(thisJournalsChildren, async childJ => {
            // let childJFilter = filterJournal(childJ, reqUserID);
            returnArr.push(await addChildren({data: childJ}, reqUserID));
        });
        return returnArr;
    }
}

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    if(!req.params.var1){
        res.status(404);
        return res.send(`Error: Invalid JournalID`);
    }

    let token = null;
    if(typeof req.headers.authorization === `string`){
        token = req.headers.authorization.replace(`Bearer `, ``);
    }

    if(!token &&! config.devMode) {
        return res.send(`Invalid Token!`);
    }

    let JournalInfo = await Journal.findOne({'id': req.params.var1}) || null;
    let user = token ? await User.findOne({'token': token}) : null;

    let authenticated = (JournalInfo && user) && user.id === JournalInfo.authorID;

    if(config.devMode) {
        console.log(`[Remix Tree Route] Skipping usual security precautions because devmode is on...`);
        authenticated = true;
        user = await User.findOne({id: `1`}); // System account
    }
    if(!JournalInfo || (JournalInfo.visibility === `private` && authenticated)){
        // return res.send(returnObj);
        res.status(404);
        return res.send(`Error: Invalid JournalID`);
    }

    res.status(200);
    let rootN = await getRootNode(req.params.var1);
    return res.json(await addChildren(rootN, user.id));
}

export let params = 1;