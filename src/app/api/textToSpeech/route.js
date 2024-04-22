import { NextResponse } from "next/server";

import fs   from "fs";
import path from "path";

import * as dotenv from "dotenv";
import { env } from "../../config/env";

import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

async function POST_FAKE(req) {
    const response_data = {
	synthesizedAudioFilename: 'public/tmp/fake-synthesized-audio.mp3',
	synthesizedAudioBlob: null
    };

    return NextResponse.json(response_data);
}

async function POST_REAL(req) {
    const body = await req.json();
    const text = body.text;
    
    const audioFileType = "mp3";
    const audioFileExt  = "."+audioFileType
    const audioMimeType = "audio/mpeg";
    
    const tmpDir        = path.join("public","tmp");
    const audioFilePath = path.join(tmpDir,"synthesized-audio"+audioFileExt);
    
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

	console.log("OpenAI returned audio:");
	console.log(audio);
	
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

export async function POST(req) {

    //const returned_response = await POST_FAKE(req);
    const returned_response = await POST_REAL(req);

    return returned_response;
}

// The following config setting resolves an issue that was causing
// a 502 (Bad Gateway) error when the Next.js server is run through
// a proxy server, and a longer audio recording is posted
//
// For more details, see:
//   https://stackoverflow.com/questions/63968953/why-do-i-get-a-502-gateway-error-from-nextjs-app-hosted-on-firebase-for-post-r

export const config = {
  api: {
      // Disables call to body parsing module, to prevent the
      // double-parsing issue that causes one to get stuck
      bodyParser: false
      
      // Or for a version that is on for 'npm run dev' but not production mode:
      // bodyParser: process.env.NODE_ENV !== 'production'      
  }
};
