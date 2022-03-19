import express from 'express';
import {uptimestart} from '../../index';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    return res.send((Math.floor(((Date.now() - uptimestart) / 1000) / 60)).toString() + ` Minutes`);
}