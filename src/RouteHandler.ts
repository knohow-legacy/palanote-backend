/* eslint-disable @typescript-eslint/no-var-requires */
import glob from 'glob';
import colors from 'colors';
import {app} from './index';
export class RouteHandler {
    id: string;
    constructor(id: string){
        this.id = id;
    }

    async LoadRoutes(): Promise<null> {
        // Router Handler!
        glob(__dirname + `/routes/**/*.*`, {absolute: false}, (error, files) => {
            files = files.filter(f => !f.endsWith(`.map`));
            if (files.length === 0) return console.log(colors.red(`[WARNING] Unable to locate any Routes. Webserver will be unable to respond to requests.`));
            else console.log(colors.yellow(`[ROUTER] Loading ${files.length} routes...`));
            files.forEach(async filePath => {
                let backupPath = filePath.toString();
                let pieceArr: string[] = backupPath.split(`/`);

                let routeName = pieceArr[pieceArr.length - 1].replace(`.js`, ``).replace(`.ts`, ``);

                let fileData = require(filePath);
                if(!fileData.params) fileData.params = 0;

                if(pieceArr.includes(`GET`)){
                    let routeString = `/api/${routeName}`;
                    for(let item = 0; item < fileData.params; item++){
                        routeString = routeString.concat(`/:var${item + 1}`);
                    }
                    app.get(routeString, async (req, res) => {
                        await fileData.run(req, res);
                    });
                    console.log(colors.green(`[ROUTER] GET ${routeString} Loaded!`));
                }
                else if(pieceArr.includes(`DELETE`)){
                    let routeString = `/api/${routeName}`;
                    for(let item = 0; item < fileData.params; item++){
                        routeString = routeString.concat(`/:var${item + 1}`);
                    }
                    app.delete(routeString, async (req, res) => {
                        await fileData.run(req, res);
                    });
                    console.log(colors.green(`[ROUTER] DELETE ${routeString} Loaded!`));
                }
                else if(pieceArr.includes(`POST`)){
                    let routeString = `/api/${routeName}`;
                    for(let item = 0; item < fileData.params; item++){
                        routeString = routeString.concat(`/:var${item + 1}`);
                    }
                    app.post(routeString, async (req, res) => {
                        await fileData.run(req, res);
                    });
                    console.log(colors.green(`[ROUTER] POST ${routeString} Loaded!`));
                }
                else if(pieceArr.includes(`PUT`)){
                    let routeString = `/api/${routeName}`;
                    for(let item = 0; item < fileData.params; item++){
                        routeString = routeString.concat(`/:var${item + 1}`);
                    }
                    app.put(routeString, async (req, res) => {
                        await fileData.run(req, res);
                    });
                    console.log(colors.green(`[ROUTER] PUT ${routeString} Loaded!`));
                }
                else if(pieceArr.includes(`PATCH`)){
                    let routeString = `/api/${routeName}`;
                    for(let item = 0; item < fileData.params; item++){
                        routeString = routeString.concat(`/:var${item + 1}`);
                    }
                    app.patch(routeString, async (req, res) => {
                        await fileData.run(req, res);
                    });
                    console.log(colors.green(`[ROUTER] PATCH ${routeString} Loaded!`));
                }
            });
        });
        return;
    }
}