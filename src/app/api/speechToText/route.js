import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import { env } from "../../config/env";

dotenv.config();

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

async function POST_FAKE(req) {
    const response_data = {
	//recognizedTextData: { text: '[Fake text response -- Testing, testing, one, two, three.]' },
	recognizedTextData: { text: 'What is the name of the river that flows through Hamilton, New Zealand?' },
	recordedAudioFilename: 'public/tmp/spoken-audio.webm'
    };

    return NextResponse.json(response_data);
}

async function POST_REAL(req) {
    const body = await req.json();
    const base64Audio = body.audio;
    const audioMimeType = body.mimeType;
    
    const audio = Buffer.from(base64Audio, "base64");

    // Example mime types:
    //   audio/wav
    //   audio/webm;codecs=opus    
    
    const fileExt  = audioMimeType.replace(/^\w+\/(\w+)(?:;.+)?$/,".$1");    
    const tmpDir   = path.join("public","tmp");
    const filePath = path.join(tmpDir,"spoken-audio"+fileExt);

    console.log(`audioMimeType = ${audioMimeType}`);
    console.log(`fileExt = ${fileExt}`);
    
    try {

	if (!fs.existsSync(tmpDir)) {
	    console.log("Creating temporary directory for audio recording: " + tmpDir);
	    fs.mkdirSync(tmpDir);
	}
	
	
	fs.writeFileSync(filePath, audio);
	const readStream = fs.createReadStream(filePath);
	const data = await openai.audio.transcriptions.create({
	    file: readStream,
	    model: "whisper-1",
	});
	
	// Remove the file after use
	console.log("Supressing deletion of audio file");
	//fs.unlinkSync(filePath);

	const response_data = { recognizedTextData: data, recordedAudioFilename: filePath };

	return NextResponse.json(response_data);
    }
    catch (error) {
	console.error("Error processing audio:", error);
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
