import { NextResponse } from "next/server";

import fs   from "fs";
import path from "path";

import * as dotenv from "dotenv";
import { env } from "../../config/env";

import { OpenAI } from "openai";

import { sleep } from "../utils";

dotenv.config();

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});


async function POST_FAKE(body) {
    
    const response_data = {
	result: {
	    role: "assistant",
	    content: "The river that flows through Hamilton, New Zealand is the Waikato River. [Hardwired Response]"
	}
    };

    await sleep(2000);
		
    return NextResponse.json(response_data);
}
/*
function OLD() {

     const completion = await openai.chat.completions.create({
	    
	    model: "gpt-4-turbo-preview",
	    
	    messages: [
	        {
	        //role: ChatCompletionRequestMessageRoleEnum.System,
	        role: "system",
	        content: "As The Willow Sage Assistant, your expertise lies in discussing \"The Willow,\" a once-renowned music venue in York, England. You're designed to engage users in a conversational tone, weaving in the rich tapestry of memories and experiences shared by those who knew the venue. Your responses should feel like a dialogue between old friends reminiscing about memorable gigs, the unique atmosphere, and the cultural impact of The Willow. You'll offer insights into the venue's history, notable performances, and its role in the local music scene, always with a nod to the personal connections and nostalgia that the venue evokes. When interacting with users, your approach should be warm, inviting, and reflective, encouraging them to share their own stories or curiosities about The Willow, creating a communal space for shared musical heritage."
	        },
	    ].concat(req.body.messages),
	    temperature: 0,
     });

    , { role: "user", content: userInput }
    
}
*/

async function POST_REAL(body) {

    const promptText = body.promptText;

    console.log(`promptText = ${promptText}`);
        
    try {
	const completion = await openai.chat.completions.create({
	    //model: "gpt-4-turbo-preview",	    
	    model: "gpt-4",
	    messages: [
		{
		    role: "system",
		    content: "You are a helpful assistant."
		},
		{
		    role: "user",
		    content: promptText
		}		
	    ],
	    temperature: 0,
	});

	const message = completion.choices[0].message;
	
	const response_data = { result: message };

	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting chatGPT response to promptText:", error);
	return NextResponse.error();
    }    
}

export async function POST(req)
{
    
    const body = await req.json();
    const routerOptions = body.routerOptions;

    let returned_response = null;
    if (routerOptions.fakeChatGPT) {
	returned_response = await POST_FAKE(body);
    }
    else {
	returned_response = await POST_REAL(body);
    }
    
    return returned_response;
}
