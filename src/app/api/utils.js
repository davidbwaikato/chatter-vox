
import fs from "fs";

import { Readable } from "stream";
//const { finished } = require('stream/promises');
import { finished } from "stream/promises";

import https from "https";

import * as dotenv from "dotenv";
import { env } from "../config/env";


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

// Adpated from:
//   https://medium.com/deno-the-complete-reference/sending-form-data-using-fetch-in-node-js-8cedd0b2af85

// Also, https://stackoverflow.com/questions/74355521/upload-file-in-formdata-with-builtin-nodejs-fetch

async function postPapaReoTranscribe(audio_ifilename, mime_type)
{
    const body = new FormData();

    const blob = new Blob([fs.readFileSync(audio_ifilename)], {type: mime_type});

    body.set("audio_file", blob, audio_ifilename);
    body.set("with_metadata", "false");
    
    const resp = await fetch("https://api.papareo.io/tuhi/transcribe", {
	method: "POST",
	headers: {
	    'Accept':        "application/json",
	    'Authorization': "Token " + env.PAPAREO_API_KEY,
	},	
	body
    });

    /*
    console.log(
	"STATUS:",
	resp.status,
	"\nCONTENT TYPE:",
	resp.headers.get("content-type"),
    );
    */
    /*
    if (resp.status == 200) {
    }
    */
    
    const response_text = await resp.text();    
    console.log("RAW BODY:", response_text);

    const response_json = JSON.parse(response_text);

    let transcription = null;
    
    if (response_json.success) {
	transcription = response_json.transcription;
    }
    else {
	console.error("Failed to transcribe audio using Papa Reo API");
    }

    console.log(`*** transcribed text = ${transcription}`);
    return transcription;
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
    
    const resp = await fetch(url);
    if (resp.ok && resp.body) {
	console.log("downloadURL(): Writing to file:", ofilename);
	let writer = fs.createWriteStream(ofilename);
	await finished(Readable.fromWeb(resp.body).pipe(writer));		
    }
    else {
	download_status = false;
    }

    return download_status;    
}


export { sleep, postPapaReoTranscribe, postPapaReoSynthesize, downloadURL };
