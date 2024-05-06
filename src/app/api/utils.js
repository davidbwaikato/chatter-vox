
//import { createWriteStream } from "fs";

//const fs = require('fs');
import fs from "fs";
//const { Readable } = require('stream');
import { Readable } from "stream";
const { finished } = require('stream/promises');

import * as dotenv from "dotenv";
import { env } from "../config/env";

//const https = import("https");
//const https = require('https');
import https from "https";

dotenv.config();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve,ms));
}






// https://stackoverflow.com/questions/52951091/how-to-use-async-await-with-https-post-request
function doRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

	res.on('end', () => {
	console.log("**** responseBody = " + responseBody);
        resolve(JSON.parse(responseBody));
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data)
    req.end();
  });
}

async function postPapaReoSynthesize(text)
{
    // text - The text you want spoken
    // speed - Any valid number to speed up or slow the voice
    // response_type - Either 'stream' it directly or return a short-lived 'url'
    /// voice_id - Choose the voice id: pita

    const post_data = {
	"text": text,
	"speed": 1,
	"response_type": "url",
	"voice_id": "pita"
    };

    const post_data_str = JSON.stringify(post_data);
    
    var options = {
	host: 'api.papareo.io',
	port: 443,
	path: '/reo/synthesize',
	method: 'POST',

	headers: {
	    'Accept':        "application/json",
	    'Authorization': "Token " + env.PAPAREO_API_KEY,
	    'Content-Type':  "application/json"
	}
    };


    const response_data = await doRequest(options, post_data_str);

    return response_data.audio_url;
}



async function downloadURL(url,ofilename)
{
    let download_status = true;
    
    //const fileName = url.split("/").pop();
    
    const resp = await fetch(url);
    if (resp.ok && resp.body) {
	console.log("downloadURL(): Writing to file:", ofilename);
	let writer = fs.createWriteStream(ofilename);
	//Readable.fromWeb(resp.body).pipe(writer);
	await finished(Readable.fromWeb(resp.body).pipe(writer));
	
	//const stream = fs.createWriteStream('output.txt');
	//const { body } = await fetch(url);
	//await finished(Readable.fromWeb(body).pipe(stream));
	
    }
    else {
	download_status = false;
    }

    return download_status;    
}


export { sleep, postPapaReoSynthesize, downloadURL };
