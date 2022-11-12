/* eslint-disable quotes */
import fs from 'fs';

export interface PostData {
    "postSVG": string
    "postJSON": string,
    "postPreviewSVG": string
}

export class FileManager {
    path: string;
    constructor(ipath){
        console.log(`[FILE MANAGER] Acting on path ${ipath}`);
        this.path = ipath;
    }

    public async checkPostExists(userID: string, postID: string): Promise<boolean>{
        let dirExists = fs.existsSync(`${this.path}/${userID}`);
        if(!dirExists) return false;
        return (fs.existsSync(`${this.path}/${userID}/${postID}.json`) && fs.existsSync(`${this.path}/${userID}/${postID}.svg`) && fs.existsSync(`${this.path}/${userID}/${postID}-preview.svg`));
    }

    public async makePost(userID: string, postID: string, postData: PostData): Promise<void> {
        if(!fs.existsSync(`${this.path}/${userID}`)){
            fs.mkdirSync(`${this.path}/${userID}`);
        }
        fs.writeFileSync(`${this.path}/${userID}/${postID}.json`, postData.postJSON.toString());
        fs.writeFileSync(`${this.path}/${userID}/${postID}.svg`, postData.postSVG.toString());
        fs.writeFileSync(`${this.path}/${userID}/${postID}-preview.svg`, postData.postPreviewSVG.toString());
        return;
    }

    // SVG String
    public async fetchPostSVG(userID: string, postID: string): Promise<string> {
        if(!await this.checkPostExists(userID, postID)) return null;
        let PostContent = fs.readFileSync(`${this.path}/${userID}/${postID}.svg`).toString();
        return PostContent;
    }

    // JSON String
    public async fetchPostJSON(userID: string, postID: string): Promise<string> {
        if(!await this.checkPostExists(userID, postID)) return null;
        let PostContent = JSON.parse(fs.readFileSync(`${this.path}/${userID}/${postID}.json`).toString());
        return PostContent;
    }

    // Preview SVG
    public async fetchPostPreviewSVG(userID: string, postID: string): Promise<string> {
        if(!await this.checkPostExists(userID, postID)) return null;
        let PostContent = fs.readFileSync(`${this.path}/${userID}/${postID}-preview.svg`).toString();
        return PostContent;
    }

    public async deletePost(userID: string, postID: string): Promise<void> {
        if(!await this.checkPostExists(userID, postID)) return null;
        if(fs.existsSync(`${this.path}/${userID}/${postID}.json`)) fs.unlinkSync(`${this.path}/${userID}/${postID}.json`);
        if(fs.existsSync(`${this.path}/${userID}/${postID}.svg`)) fs.unlinkSync(`${this.path}/${userID}/${postID}.svg`);
        if(fs.existsSync(`${this.path}/${userID}/${postID}-preview.svg`)) fs.unlinkSync(`${this.path}/${userID}/${postID}-preview.svg`);
        return;
    }
}