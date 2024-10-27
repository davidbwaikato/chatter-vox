import { NextResponse } from "next/server";

import fs   from "fs";
import path from "path";

import * as dotenv from "dotenv";
import { env } from "../../config/env";

import { OpenAI } from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

import Anthropic from '@anthropic-ai/sdk';

import { sleep } from "../utils";

dotenv.config();

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});


async function POST_FAKE(body) {
    
    const response_data = {
	result: {
	    userMessage: {
		role:    "user",
		content: "What is the name of the river thay flows through Hamilton, New Zealand"
	    },
	    returnedTopMessage: {
		role:    "assistant",
		content: "The river that flows through Hamilton, New Zealand is the Waikato River. [Hardwired Response]",
		language: "en"
	    }
	}
    };

    await sleep(2000);
		
    return NextResponse.json(response_data);
}


const LanguageIdentifiedResponse = z.object({
    markdownResponse: z.string(),
    language: z.string()
});

async function POST_OPENAI(body) {

    const messages   = body.messages;
    let promptText = body.promptText;

    //console.log("[ChatLLM route.js] messages:");
    //console.log(messages);
		
    //console.log(`promptText = ${promptText}`);
    
    promptText += "\n\nReturn your answer using JSON syntax.  The JSON should have a field called 'markdownResponse' that contains the LLM response to the given prompt using Markdown syntax.  The JSON should also have a field called 'language' that identifies the language that the prompt was written in, using the 2 letter code version of ISO 3166";
    
    const newUserMessage = {
	role: "user",
	content: promptText
    };
    
    const updatedMessages = [...messages, newUserMessage];
    
    try {
	//const completion = await openai.chat.completions.create({
	const completion = await openai.beta.chat.completions.parse({
	    //model: "gpt-4-turbo-preview",
	    model: "gpt-4o",
	    messages: updatedMessages,
	    temperature: 0,
	    response_format: zodResponseFormat(LanguageIdentifiedResponse, "language_identified_response"),
	});

	//const returnedTopMessage = completion.choices[0].message;
	
	/*
	const returnedTopMessage_jsonstr = completion.choices[0].message;
	console.log("**** returnedTopMessage_jsonstr = ", returnedTopMessage_jsonstr);

	let returnedTopMessage = JSON.parse(returnedTopMessage_jsonstr);
	*/
	
	const returnedTopMessage_json = completion.choices[0].message.parsed;
	console.log("**** returnedTopMessage_json = ", returnedTopMessage_json);
	
	//const returnedTopMessage = returnedTopMessage_json.markdownResponse;

	const returnedTopMessage =  {
	    role: 'assistant',
	    content: returnedTopMessage_json.markdownResponse,
	    language: returnedTopMessage_json.language,
	    refusal: null
	};

	/*
	console.log("**** returnedTopMessage: ", returnedTopMessage);

	if ('markdownResponse' in returnedTopMessage) {
	    returnedTopMessage = returnedTopMessage.markdownResponse;
	}
	*/
	
	const response_data = { result: { userMessage: newUserMessage, returnedTopMessage: returnedTopMessage} };

	console.log("**** Response data:", response_data);	
	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting OpenAI response to promptText:", error);	
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

    // The following (when translated) apears to say 'I prefer to answer in English'.  So I have cut this out for now!
    //updatedMessages.unshift({"role": "assistant", "content": "Tēnā koe. Ka āhei ahau ki te whakahoki i ētahi whakautu i te reo Māori, engari kāore anō ā tō̅ku mōhio i te reo Māori e tino whānui ana. Mehemea ka tīmatahia koe ki te kōrero Māori, ka whakaputa ā tōku engari kāore ā tōku i te tino pūkenga ki tēnei reo. He pai kē ki ahau te whakautu i te reo Ingarihi."});
    updatedMessages.unshift({"role": "assistant", "content": "Tēnā koe. Ka āhei ahau ki te whakahoki i ētahi whakautu i te reo Māori, engari kāore anō ā tō̅ku mōhio i te reo Māori e tino whānui ana. Mehemea ka tīmatahia koe ki te kōrero Māori, ka whakaputa ā tōku engari kāore ā tōku i te tino pūkenga ki tēnei reo."});
    updatedMessages.unshift({"role": "user", "content": "You are a chatbot that always gives your answers in te reo Maori"});

    
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
    const post_lookup_fn = PostLookup[configOptions.params.chatLLM];

    const returned_response = post_lookup_fn(body);

    return returned_response;
}
