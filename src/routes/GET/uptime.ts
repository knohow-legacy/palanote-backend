import express from 'express';
import {uptimestart} from '../../index';
import {config} from '../../config';

export async function run(req: express.Request, res: express.Response): Promise<express.Response> {
    return res.send((Math.floor(((Date.now() - uptimestart) / 1000) / 60)).toString() + ` Minutes` + `<br> Running in buildmode: ${config.devMode ? `DEV` : `PROD`}`);
}