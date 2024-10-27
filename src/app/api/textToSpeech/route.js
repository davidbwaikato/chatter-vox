import { NextResponse } from "next/server";

import fs   from "fs";
import path from "path";
import process from "process";
import tmp from "tmp";

import * as dotenv from "dotenv";
import { env } from "../../config/env";

import OpenAI from "openai";

import { sleep, postPapaReoSynthesize, downloadURL } from "../utils";

dotenv.config();

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

async function POST_FAKE(body) {

    const response_data = {
	synthesizedAudioFilename: path.join("public","tmp","fake-synthesized-audio.mp3"),
	synthesizedAudioBlob: null
    };

    // Small delay so it feels like some work has been done!
    await sleep(1000);
    
    return NextResponse.json(response_data);
}


async function POST_PAPAREO(body) {
    const text = body.text;
    
    const audioFileType = "mp3";
    const audioFileExt  = "."+audioFileType
    const audioMimeType = "audio/mpeg";
    
    const tmpDir        = path.join("public","tmp");

    const tmpOptions = {
	tmpdir: tmpDir,
	prefix: `synthesized-audio--`,
	postfix: audioFileExt,
	keep: true
    };
        
    //const audioFilePathOLD = path.join(tmpDir,"synthesized-audio"+audioFileExt);
    const audioFilePath = tmp.tmpNameSync(tmpOptions).replace(process.cwd()+"/","");
    
    //console.log(`audioFilePathOLD = ${audioFilePathOLD}`);
    console.log(`audioFilePath    = ${audioFilePath}`);
    
    try {
	if (!fs.existsSync(tmpDir)) {
	    console.log("Creating temporary directory for audio recording: " + tmpDir);
	    fs.mkdirSync(tmpDir);
	}
	
	const audio_url = await postPapaReoSynthesize(text)
	
	console.log("PapaReo returned audio_url:");
	console.log(audio_url);

	const download_status = await downloadURL(audio_url,audioFilePath);		    
		
	const response_data = {
	    synthesizedAudioFilename: audioFilePath,
	    synthesizedAudioMimeType: audioMimeType
	};
	
	return NextResponse.json(response_data);
    }
    catch (error) {
	console.error("Error synthesizing audio from text:", error);
	return NextResponse.error();
    }
}


async function POST_OPENAI(body) {
    const text = body.text;
    
    const audioFileType = "mp3";
    const audioFileExt  = "."+audioFileType
    const audioMimeType = "audio/mpeg";
    
    const tmpDir        = path.join("public","tmp");
    //const pid           = process.pid;

    const tmpOptions = {
	tmpdir: tmpDir,
	//prefix: `synthesized-audio-${pid}--`,
	prefix: `synthesized-audio--`,
	postfix: audioFileExt,
	keep: true
    };
        
    const audioFilePathOLD = path.join(tmpDir,"synthesized-audio"+audioFileExt);
    const audioFilePath = tmp.tmpNameSync(tmpOptions).replace(process.cwd()+"/","");
    
    console.log(`audioFilePathOLD = ${audioFilePathOLD}`);
    console.log(`audioFilePath    = ${audioFilePath}`);
    
    try {
	if (!fs.existsSync(tmpDir)) {
	    console.log("Creating temporary directory for audio recording: " + tmpDir);
	    fs.mkdirSync(tmpDir);
	}
	
	// Based on:
	//    https://platform.openai.com/docs/guides/text-to-speech?lang=node
	
	// Voices:
	//   alloy, echo, fable, onyx, nova, and shimmer

	// Response format:
	//  mp3, opus, aac, flac, wav, and pcm	

	const audio = await openai.audio.speech.create({
	    model: "tts-1",      // optimized for speed
	    //model: "tts-1-hd", // optimized for quality
	    voice: "fable",	    
	    input: text,
	    response_format: audioFileType
	});

	//console.log("OpenAI returned audio:");
	//console.log(audio);
	
	const buffer = Buffer.from(await audio.arrayBuffer());
	console.log(`Saving synthesized audio as: ${audioFilePath}`);
	await fs.promises.writeFile(audioFilePath, buffer);

	const audioBlob = new Blob([buffer], { type: "audio/mpeg"});
	//const audioBlob = audio.blob;
	//const audioBlob = new Blob([audio],{ type: "audio/mpeg"});
	//const audioBlob = audio;
	console.log("textToSpeech.POST()");
	console.log(audioBlob);
		    
	const response_data = {
	    synthesizedAudioFilename: audioFilePath,
	    //synthesizedAudioBlob:     audioBlob,
	    synthesizedAudioMimeType: audioMimeType
	};

	return NextResponse.json(response_data);
    }
    catch (error) {
	console.error("Error synthesizing audio from text:", error);
	return NextResponse.error();
    }
}

const PostLookup = {
    "fake"    : POST_FAKE,
    "PapaReo" : POST_PAPAREO,
    "OpenAI"  : POST_OPENAI
};


export async function POST(req)
{    
    const body = await req.json();

    //console.log("**** textToSpeech:POST(), body.text = " + body.text)
    
    const configOptions = body.configOptions;

    const post_lookup_fn = PostLookup[configOptions.params.textToSpeech];

    const returned_response = post_lookup_fn(body);
    
    return returned_response;
}

// The following config setting resolves an issue that was causing
// a 502 (Bad Gateway) error when the Next.js server is run through
// a proxy server, and a longer audio recording is posted
//
// For more details, see:
//   https://stackoverflow.com/questions/63968953/why-do-i-get-a-502-gateway-error-from-nextjs-app-hosted-on-firebase-for-post-r

// Also:
//   https://nextjs.org/docs/pages/building-your-application/routing/api-routes#custom-config

export const config = {
  api: {
      // Disables call to body parsing module, to prevent the
      // double-parsing issue that causes one to get stuck
      bodyParser: false
      
      // Or for a version that is on for 'npm run dev' but not production mode:
      // bodyParser: process.env.NODE_ENV !== 'production'      
  }
};
