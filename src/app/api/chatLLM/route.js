import { NextResponse } from "next/server";

import fs   from "fs";
import path from "path";

import * as dotenv from "dotenv";
import { env } from "../../config/env";

import { OpenAI } from "openai";
import Anthropic from '@anthropic-ai/sdk';

import { sleep } from "../utils";

dotenv.config();

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

/*

const msg = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude how are you today?" }],
});
console.log(msg);
*/



async function POST_FAKE(body) {
    
    const response_data = {
	result: {
	    userMessage: {
		role:    "user",
		content: "What is the name of the river thay flows through Hamilton, New Zealand"
	    },
	    returnedTopMessage: {
		role:    "assistant",
		content: "The river that flows through Hamilton, New Zealand is the Waikato River. [Hardwired Response]"
	    }
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

async function POST_OPENAI(body) {

    const messages   = body.messages;
    const promptText = body.promptText;

    //console.log("[ChatLLM route.js] messages:");
    //console.log(messages);
		
    //console.log(`promptText = ${promptText}`);

    const newUserMessage = {
	role: "user",
	content: promptText
    };
    
    const updatedMessages = [...messages, newUserMessage];
    
    try {
	const completion = await openai.chat.completions.create({
	    //model: "gpt-4-turbo-preview",	    
	    model: "gpt-4",
	    messages: updatedMessages,
	    temperature: 0,
	});

	const returnedTopMessage = completion.choices[0].message;
	
	const response_data = { result: { userMessage: newUserMessage, returnedTopMessage: returnedTopMessage} };
	//console.log("Response data:");
	//console.log(response_data)
	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting response from " + props.routerOptions.chatLLM + " to promptText:", error);
	return NextResponse.error();
    }    
}


async function POST_CLAUDE(body)
{

    const messages   = body.messages;
    const promptText = body.promptText;

    /*
    console.log("[ChatLLM route.js] messages:");
    console.log(messages);
		
    console.log(`promptText = ${promptText}`);
    */
    
    const newUserMessage = {
	role: "user",
	content: promptText
    };
    
    const updatedMessages = [...messages, newUserMessage];
    updatedMessages.shift();
    updatedMessages.shift();

    updatedMessages.unshift({"role": "assistant", "content": "Tēnā koe. Ka āhei ahau ki te whakahoki i ētahi whakautu i te reo Māori, engari kāore anō ā tō̅ku mōhio i te reo Māori e tino whānui ana. Mehemea ka tīmatahia koe ki te kōrero Māori, ka whakaputa ā tōku engari kāore ā tōku i te tino pūkenga ki tēnei reo. He pai kē ki ahau te whakautu i te reo Ingarihi."});
    updatedMessages.unshift({"role": "user", "content": "You are an chatbot the always gives your answers in te reo Maori"});

    
    //console.log("[Anthropic/Claude route.js] updatedMessages:");
    //console.log(updatedMessages);

    
    try {
	const message = await anthropic.messages.create({
	    model: 'claude-3-opus-20240229',
	    max_tokens: 1024,
	    messages: updatedMessages,
	});

	//console.log(message.content);
	
	const returnedTopMessage = { role: "assistant", content: message.content[0].text }
	
	const response_data = { result: { userMessage: newUserMessage, returnedTopMessage: returnedTopMessage} };
	//console.log("Response data:");
	//console.log(response_data);
	
	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting Anthropic Claude response to promptText:", error);
	return NextResponse.error();
    }    

    
}

const PostLookup = {
    "fake"      : POST_FAKE,
    "Claude"    : POST_CLAUDE,
    "OpenAI"    : POST_OPENAI
};

    
export async function POST(req)
{    
    const body = await req.json();
    const configOptions = body.configOptions;

    //console.log(configOptions);
    const post_lookup_fn = PostLookup[configOptions.chatLLM];

    const returned_response = post_lookup_fn(body);

    return returned_response;
}
