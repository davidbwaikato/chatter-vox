import { NextResponse } from "next/server";

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


const LanguageIdentifiedResponse = z.object({
    markdownResponse: z.string(),
    language: z.string(),
    configurationInstruction: z.boolean()
});

const initialMessagesOpenAI = [
    { role: "system",    content: "You are a helpful assistant" }, // To set the general tone of the assistant

    { role: "system",    content:      
        `Always return your answer using JSON syntax.  
         The JSON should have a field called 'markdownResponse' that contains the LLM response to the given prompt using Markdown syntax.  
         The JSON should also have a field called 'language' that identifies the language that the prompt was written in, using the 2 letter code version of ISO 3166.
         The JSON should also have a field called 'configurationInstruction' that is a Boolean value that is set to true if the given prompt is actually an instruction about how the user would like the user-interface to be reconfigured.`
    },
      
    { role: "assistant", content: "How can I help you today?" } // i.e., synthesized response
];

const initialMessagesClaude_TeTaka = [
    // The following (when translated) apears to say at the very end 'I prefer to answer in English'.
    // => So I have cut this out for now!
    //
    // {"role": "assistant", "content": "Tēnā koe. Ka āhei ahau ki te whakahoki i ētahi whakautu i te reo Māori, engari kāore anō ā tō̅ku mōhio i te reo Māori e tino whānui ana. Mehemea ka tīmatahia koe ki te kōrero Māori, ka whakaputa ā tōku engari kāore ā tōku i te tino pūkenga ki tēnei reo. He pai kē ki ahau te whakautu i te reo Ingarihi."},
    
    {"role": "assistant", "content": "Tēnā koe. Ka āhei ahau ki te whakahoki i ētahi whakautu i te reo Māori, engari kāore anō ā tō̅ku mōhio i te reo Māori e tino whānui ana. Mehemea ka tīmatahia koe ki te kōrero Māori, ka whakaputa ā tōku engari kāore ā tōku i te tino pūkenga ki tēnei reo."},
    
    {"role": "user",      "content": "You are a chatbot that always gives your answers in te reo Maori"}
];
    
const initialMessagesClaude = [
    { role: "user",        content: "You are a helpful assistant" } // Some general prompting to set the tone of the assistant
];

async function POST_FAKE(body) {
    
    const response_data = {
	result: [
	    {
		role:    "user",
		content: "What is the name of the river thay flows through Hamilton, New Zealand"
	    },
	    {
		role:    "assistant",
		content: "The river that flows through Hamilton, New Zealand is the Waikato River. [Hardwired Response]",
		language: "en"
	    }
	]
    };

    await sleep(2000);
		
    return NextResponse.json(response_data);
}


async function POST_OPENAI(body) {

    const messages   = (body.messages == null) ? initialMessagesOpenAI : body.messages;
    let promptText = body.promptText;

    console.log("[ChatLLM route.js, OpenAI] [context] messages:");
    console.log(messages);
    
    //console.log(`promptText = ${promptText}`);
    
    const newUserMessage = {
	role: "user",
	content: promptText
    };
    
    const updatedMessages = [...messages, newUserMessage];
    
    try {
	const completion = await openai.beta.chat.completions.parse({
	    //model: "gpt-4-turbo-preview",
	    model: "gpt-4o",
	    messages: updatedMessages,
	    temperature: 0,
	    response_format: zodResponseFormat(LanguageIdentifiedResponse, "language_identified_response"),
	});
	
	const returnedTopMessage_json = completion.choices[0].message.parsed;
	console.log("**** returnedTopMessage_json = ", returnedTopMessage_json);
	//console.log("****     choice[0] = ", completion.choices[0]);
	
	const returnedTopMessage =  {
	    role: 'assistant',
	    content: returnedTopMessage_json.markdownResponse,
	    language: returnedTopMessage_json.language,
	    configurationInstruction: returnedTopMessage_json.configurationInstruction,
	    refusal: completion.choices[0].message.refusal 	    
	};

	const updatedMessagesWithTopAnswer = [...updatedMessages, returnedTopMessage ];
	const response_data = { result: updatedMessagesWithTopAnswer };
	
	//console.log("**** Response data:", response_data);	
	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting OpenAI response to promptText:", error);	
	return NextResponse.error();
    }    
}


async function POST_CLAUDE(body)
{
    const messages   = (body.messages == null) ? initialMessagesClaude : body.messages;
    const promptText = body.promptText;

    console.log("[ChatLLM route.js, Clause] [context} messages:");
    console.log(messages);

    //console.log(`promptText = ${promptText}`);
    
    const newUserMessage = {
	role: "user",
	content: promptText
    };
    
    const updatedMessages = [...messages, newUserMessage];
    
    //console.log("[Anthropic/Claude route.js] updatedMessages:");
    //console.log(updatedMessages);
    
    try {
	const message = await anthropic.messages.create({
	    model: 'claude-3-opus-20240229', // **** update model specified??
	    max_tokens: 1024,
	    messages: updatedMessages,
	});

	//console.log(message.content);
	
	const returnedTopMessage = { role: "assistant", content: message.content[0].text }

	const updatedMessagesWithTopAnswer = [...updatedMessages, returnedTopMessage ];
	const response_data = { result: updatedMessagesWithTopAnswer };

	//console.log("Response data:");
	//console.log(response_data);
	
	return NextResponse.json(response_data);	
    }
    catch (error) {
	console.error("Error getting Anthropic Claude response to promptText:", error);
	return NextResponse.error();
    }    
}


async function postGenerateLanguageInterfaceOpenAI(body) {
        
    console.log("[ChatLLM route.js, OpenAI] GenerateLanguageInterface");

    const InterfaceTextResponse = z.object({
	markdownResponse: z.string(),
	language: z.string(),
	configurationInstruction: z.boolean()
    });

    const languageFragSchema = z.record(
	//z.string().length(2),
	z.string(),
	z.string()           
    );

    const interfaceTextSchema = z.record(
	//z.string().regex(/^_/, "Key must start with an underscore"), // Keys must start with "_"
	z.string(),
	languageFragSchema 
    );

    const genericSchema = z.object();
    
    /*
    const generateNewLanguageMessages = [
	{ role: "system", content: "You are an assistant that specializes in translating from English to other languages that will be used in a multi-lingual user interface." },
	
	{ role: "system", content: "The majority of the text you will be asked to translate are short text fragments.  When the text you are asked to translate is longer in length, then this is typically a sign that it is used to convey general help information to the user in the user-interface, and so will be expressed in more naturally, free-flowing sentences." },

	{ role: "system", content: "The text to translate will be provided to you as a JSON Object.  The keys to the objects are the labels that the computer software uses to look up an individual text fragments.  The key label should never be changed." },
	{ role: "system", content: "In retrieving one of the key entries, a JSON object is returned that represents all the currently translated versions of that text fragment. The keys to this returned object are the 2 letter code version of ISO 3166.  There is always a key for 'en', which represents the English text phrase.  All the other keys in the returned object are the result of earlier translations." }
    ];
    */
    

    const generateNewLanguageMessages = [
	{ role: "system", content:
	  `You are an assistant that specializes in translating from English to other languages that will be used in a multi-lingual user interface.
           The majority of the text you will be asked to translate are short text fragments.  When the text you are asked to translate is longer in length, then this is typically a sign that it is used to convey general help information to the user in the user-interface, and so will be expressed in more naturally, free-flowing sentences.
           The text to translate will be provided to you as a JSON Object.  The keys to the objects are the labels that the computer software uses to look up an individual text fragments.  The key label should never be changed.
           In retrieving one of the key entries, a JSON object is returned that represents all the currently translated versions of that text fragment. The keys to this returned object are the 2 letter code version of ISO 3166.  There is always a key for 'en', which represents the English text phrase.  All the other keys in the returned object are the result of earlier translations.`
	}
    ];
    const configOptions = body.configOptions;
    const newLang = body.newLang;
/*    
    generateNewLanguageMessages.push({
	role: "user",
	content: "Here is the current JSON object representing the translation of all the text fragements used in the interface"
    });

    generateNewLanguageMessages.push({
	role: "user",
	content: JSON.stringify(configOptions.interfaceText)
    });


    generateNewLanguageMessages.push({
	role: "user",
	content: `Based on the 'en' entry for a text fragment, return an updated version of the JSON object where a new '${newLang}' entry has be added in for all of the keys.`
    });
*/

    generateNewLanguageMessages.push({
	role: "user", content:
	"Here is the current JSON object representing the translation of all the text fragements used in the interface\n"
	+JSON.stringify(configOptions.interfaceText)+"\n"
	+`Based on the 'en' entry for a text fragment, return an updated version of the JSON object where a new '${newLang}' entry has be added in for all of the keys.`
    });

    console.log("**** generateNewLanguageMessages = ", generateNewLanguageMessages);
    
    try {
	//const completion = await openai.beta.chat.completions.parse({
	const completion = await openai.chat.completions.create({	    
	    model: "gpt-4o",
	    messages: generateNewLanguageMessages,
	    temperature: 0,
	    //response_format: zodResponseFormat(interfaceTextSchema, "language_identified_response")
	    //response_format: zodResponseFormat(genericSchema, "language_identified_response")
	    response_format: { type: "json_object" }
	});

	console.log("**** !!!! completion message = ", completion.choices[0].message);
	//const response_data = completion.choices[0].message.parsed;
	//const response_data = JSON.parse(completion.choices[0].message);
	const response_data = completion.choices[0].message;

	return NextResponse.json(response_data);

	/*
	const returnedTopMessage_json = completion.choices[0].message.parsed;
	console.log("**** returnedTopMessage_json = ", returnedTopMessage_json);
	console.log("****     choice[0] = ", completion.choices[0]);
	
	const returnedTopMessage =  {
	    role: 'assistant',
	    content: returnedTopMessage_json,
	    refusal: completion.choices[0].message.refusal 	    
	};

	//const updatedMessagesWithTopAnswer = [...generateNewLanguageMessages, returnedTopMessage ];

	//const response_data = { result: updatedMessagesWithTopAnswer };
	const response_data = { result: returnedTopMessage };
	
	//console.log("**** Response data:", response_data);	
	return NextResponse.json(response_data);	
*/
    }
    catch (error) {
	console.error("Error getting OpenAI response to GenerateNewLanguageMessages:", error);	
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

    let returned_response = null;
    
    if (body.mode == "GenerateLanguageInterface") {
	// Get this done with OpenAI's ChatGPT for now
	//await  postGenerateLanguageInterfaceOpenAI(body); // **** is this more correctly done with an await ???? 
	returned_response = postGenerateLanguageInterfaceOpenAI(body);
	
    }
    else if (body.mode == "ProcessUserPrompt") {
	const post_lookup_fn = PostLookup[configOptions.params.chatLLM];

	returned_response = post_lookup_fn(body);
    }
    else {
	console.error(`[root.js, chatLLM] Unrecognised body.mode: '${body.mode}'`);
    }
    
    return returned_response;
}
