"use client";

import { useEffect, useState, useRef } from "react";

import { interfaceTextResolver } from "@/utils/interfaceText";

import { getPeakLevel } from "@/utils/createMediaStream";

export const useRecordVoice = (props) => {
    const [text, setText]  = useState("");
    
    const [audioMimeType, setAudioMimeType] = useState("");

    const [micLevel, setMicLevel] = useState("0%");
    const [micLevelCapped, setMicLevelCapped] = useState("0%");
    const [micLevelCliprect, setMicLevelCliprect] = useState("rect(95% 100% 100% 0%)");
    
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recording, setRecording] = useState(false);

    const isRecording = useRef(false);
    const stream = useRef(null);
    const chunks = useRef([]);
    const audioContext = useRef(null);
    const sourceNode   = useRef(null);
    const analyzerNode = useRef(null);
    
    const blobToBase64 = (blob,abortController, callback) => {
	//console.log("**** blobToBase64()", blob);
	
	const reader = new FileReader();
	reader.onload = function () {
	    const type = blob.type;
	    const base64data = reader?.result?.split(",")[1];
	    callback(blob,base64data,type,abortController);
	};
	reader.readAsDataURL(blob);
    };
    
    // OpenAI supported audio formats (as of 28 April 2024):
    //   ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']"
    //
    const getOpenAISupportedMimeType = () => {
	// For web browser supported Mime type, based on details in:
	//    https://stackoverflow.com/questions/41739837/all-mime-types-supported-by-mediarecorder-in-firefox-and-chrome

	// Intersection of OpenAI transcript and web browser Mime types
	const supported_formats = [
	    "audio/ogg;codecs=opus",  // Firefox friendly
	    "audio/webm;codecs=opus", // Chrome  friendly
	    "audio/mp4;codecs=mp4a",  // Safari  friendly
	    // and then some less specific versions
	    "audio/ogg",
	    "audio/webm",
	    "audio/mp4"
	];

	let return_format = "";
	
	for (const format of supported_formats) {
	    if (MediaRecorder.isTypeSupported(format)) {
		return_format = format;
		break;
	    }
	}

	if (return_format === "") {
	    console.error("Failed to find browser supported audio MIME-type that is compatible with OpenAI's transcribe service");
	}

	return return_format;
    }
    
    const startRecording = (abortController) => {
	if (mediaRecorder) {
	    if (isRecording.current) {
		// Can end up in this situtation if the user has dragged the cursor out of the microphone area
		// and then let go.  Needs a further click on the micronphone icon to stop recording
		console.log("Already recording.  Interpretting this click event as a request to stop recording");
		stopRecording();
	    }
	    else {
		//props.updateStatusCallback("Recording ...");
		props.updateStatusCallback("_statusRecording_");
		
		isRecording.current = true;

		mediaRecorder.onstart = () => {
		    console.log("mediaRecorder.onstart()");
		    audioContext.current = new AudioContext();
		    sourceNode.current = audioContext.current.createMediaStreamSource(stream.current);
		    analyzerNode.current = audioContext.current.createAnalyser();
		    sourceNode.current.connect(analyzerNode.current);
		    
		    const tick = () => {
			
			if (isRecording.current) {
			    const peak = getPeakLevel(analyzerNode.current);
			    const peak_boosted = Math.min(peak * 130,100); // give it a bit of a visual boost!
			    
			    const peak_perc = peak_boosted;
			    const peak_str = peak_perc.toFixed(0).toString();		  
			    setMicLevel(peak_str + "%");
			    
			    const peak_capped_perc = Math.min(peak_boosted,50); 
			    const peak_capped_str = peak_capped_perc.toFixed(0).toString();		  
			    setMicLevelCapped(peak_capped_str + "%");
			    
			    const peak_cliprect_top = 100 - peak_boosted;
			    const peak_cliprect_str = `rect(${peak_cliprect_top}% 100% 100% 0%)`;
			    setMicLevelCliprect(peak_cliprect_str)
			    
			    requestAnimationFrame(tick);
			}
			else {
			    sourceNode.current.disconnect();
			    audioContext.current.close();
			    setMicLevel("0%");
			    setMicLevelCapped("0%");
			    setMicLevelCliprect("rect(95% 100% 100% 0%)");
			}
		    };
		    tick();
		    
		    chunks.current = [];
		};
		
		mediaRecorder.ondataavailable = (ev) => {
		    chunks.current.push(ev.data);
		};
		
		mediaRecorder.onstop = () => {
		    console.log("mediaRecorder.onstop()");
		    const audioMimeType = mediaRecorder.mimeType;
		    console.log("audioMimeType = " + audioMimeType);
		    setAudioMimeType(audioMimeType);      
		    
		    const audioBlob = new Blob(chunks.current, { type: audioMimeType });
		    console.log("Converting chunks to blob:");
		    console.log(audioBlob);
		    blobToBase64(audioBlob,abortController, getText);
		};
		
		
		// Controlling the timeslice to .start() to be 1000, based on OpenAI Whisper <=> Safari issue
		//   https://community.openai.com/t/whisper-problem-with-audio-mp4-blobs-from-safari/322252
		mediaRecorder.start(1000);
		setRecording(true);
	    }
	}
    };

    
    const stopRecording = () => {
	if (mediaRecorder) {
	    props.updateStatusCallback("_statusMicrophoneRecordingStopped_");
	    isRecording.current = false;
	    mediaRecorder.stop();
            setRecording(false);
	}
    };

    const getSynthesizedSpeech = async (text, abortController) => {
	props.updateStatusCallback("_statusTextToSpeechProcessing_");
	
	try {
	    const response = await fetch("/api/textToSpeech", {
		method: "POST",
		signal: abortController.signal,		
		headers: {
		    "Content-Type": "application/json",
		},
		body: JSON.stringify({
		    text: text,
		    configOptions: props.configOptionsRef.current
		}),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
	    }).catch(function(err) {
		console.error(`fetch(): ${err}`);
            });
	    
	    if (response != null) {
		// The following could be more streamlined if the server returned the blob
		// for the audio directly.  As the returned response is in JSON, this in
		// turn would need the blob to be encoded in something like base64
		
		const synthesizedAudioFilename = response.synthesizedAudioFilename;
		const synthesizedAudioMimeType = response.synthesizedAudioMimeType;
	    
		//console.log("synthesizedAudioFilename: " + synthesizedAudioFilename);

		const synthesizedAudioURL = synthesizedAudioFilename.replace(/public/,"")
		
		const synthesizedAudioBlob = await fetch(synthesizedAudioURL)
		      .then(response => response.blob())
		      .catch(function(err) {
			  console.error(`fetch(): ${err}`);
		      });

		// **** if (synthesizedAudioBlob != null) { ..... update etc }
		// otherwise display an error message as status
		props.updateStatusCallback("_statusPlayingSynthesizedResult_");		    
		props.playAudioBlobCallback(synthesizedAudioBlob);

	    }
	}
	catch (error) {
	    console.log(error);
	}
    };

    
    const getNewInterfaceLang = async (newLang) => {
	// No need for abortInterface on this one, as we want the /chatLLM fetch() here
	// to go ahead and get the translated user interface language, indepedent
	// of whether or not the user stops their actually asked question/entered prompt

	console.log(`Generate new interface for '${newLang}'`);
	
	const response = await fetch("/api/chatLLM", {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json",
	    },
	    body: JSON.stringify({
		configOptions: props.configOptionsRef.current,
		mode: "GenerateLanguageInterface",
		newLang: newLang
	    }),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
	    }).catch(function(err) {
		console.error(`getNewInterfaceLang(), fetch(): ${err}`);
            });	    
	
	if (response != null) {
	    const newInterfaceText = JSON.parse(response.content);

	    props.updateInterfaceTextLangCallback(newLang,newInterfaceText);
	}
	else {
	    console.error("Failed to retrieve new interface text from OpenAI");	    
	    props.updateStatusCallback("_statusUITranslationFailed_");
	}
    };

    const getPromptResponse = async (promptText, abortController) => {
	props.updateStatusCallback("_statusChatLLMProcessing_");
		    
	//console.log("**** getPromptResponse");
	//console.log("     " + props.messagesRef.current);
	const current_params = props.configOptionsRef.current.params;
	
	if ((current_params.speechToText == "PapaReo") || (current_params.textToSpeech == "PapaReo")) {
	    // Workflow set to use Te Hiku Media APIs => need to ensure chatLLM is set to Claude
	    console.log("Detected usage of 'PapaReo' API in current config params => Running Te Hiku Media compliance check");
	    if ((current_params.chatLLM != "Claude") && (current_params.chatLLM != "fake")) {
		console.warn(`=> Explicitly changing params.chatLLM from '${current_params.chatLLM}' to 'Claude' to be compliant with terms of use`);
		current_params.chatLLM = "Claude";
	    }
	    else {
		console.log(`=> Operating with bounds: params.chatLLM = '${params.chatLLM}'`);
	    }
	}

	
	try {
	    const response = await fetch("/api/chatLLM", {
		method: "POST",
		signal: abortController.signal,
		headers: {
		    "Content-Type": "application/json",
		},
		body: JSON.stringify({
		    configOptions: props.configOptionsRef.current,
		    mode: "ProcessUserPrompt",		    
		    messages: props.messagesRef.current,
		    promptText: promptText
		}),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
	    }).catch(function(err) {
		console.error(`fetch(): ${err}`);
            });	    
	    
	    if (response != null) {
		const result_messages = response.result;
		const result_messages_len = result_messages.length;
		
		const returned_top_message = result_messages[result_messages_len-1];
		
		// Check to see if the LLM identifed the language the request was in
		// => If language different to the current Lang state, then trigger change
		const lang = props.configOptionsRef.current.lang;		
		if ('language' in returned_top_message) {
		    const returned_lang = returned_top_message.language;
		    if (returned_lang != lang) {
			const config_options_ref = props.configOptionsRef.current;
			
			if (config_options_ref.interfaceLangs.includes(returned_lang)) {
			    config_options_ref.lang = returned_lang;  // potential to hasten use of changed language
			    props.updateLangCallback(returned_lang);
			}
			else {
			    // Asynchronously get new language text
			    // => change in interface occurs when its fetch() returns data			    
			    getNewInterfaceLang(returned_lang);
			}
		    }
		}
		
		// Check to see if it is a user interface configuration instruction
		if ('configurationInstruction' in returned_top_message) {
		    const is_a_configuration_instruction = returned_top_message.configurationInstruction;
		    if (is_a_configuration_instruction) {
			const lang_not_supported = interfaceTextResolver(props.configOptionsRef.current,"_textUIConfigurationNotSupported_",lang);
			returned_top_message.content = lang_not_supported;
		    }
		}

		const chatResponseText = returned_top_message.content;

		props.updateStatusCallback("_statusChatLLMResponseReceived_");		
		props.updateMessagesCallback(result_messages); 

		// **** Change this so _LLMSays_ is handled separately, so can change when language does
		// **** !!!!
		const lang_llm_says = interfaceTextResolver(props.configOptionsRef.current,"_LLMSays_",lang);
		setText(lang_llm_says + ":\n" + chatResponseText);
		
		getSynthesizedSpeech(chatResponseText,abortController);
	    }
	    else {		
		const lang = props.configOptionsRef.current.lang;
		const lang_llm_no_response = interfaceTextResolver(props.configOptionsRef.current,"_statusChatLLMNoResponseReceived_",lang);
		setText(lang_llm_no_response);
		props.updateStatusCallback("_statusChatLLMNoResponseReceived_");		
	    }
	    
	}
	catch (error) {
	    const lang = props.configOptionsRef.current.lang;
	    const lang_ti_network_error = interfaceTextResolver(props.configOptionsRef.current,"_textInfoNetworkError_",lang);
	    setText(lang_ti_network_error);
	    props.updateStatusCallback("_statusNetworkError_");
	    
	    console.error(error);
	}
    };
    
    
    const getText = async (blob, base64data, mimeType, abortController) => {
	props.updateStatusCallback("_statusSpeechToTextProcessing_");
	    
	try {
	  const response = await fetch("/api/speechToText", {
              method: "POST",
	      signal: abortController.signal,
              headers: {
		  "Content-Type": "application/json",
              },
              body: JSON.stringify({
		  audio: base64data,
		  mimeType: mimeType,
		  configOptions: props.configOptionsRef.current
              }),
	  }).then((res) => {
	      let json_str = null;
	      if (res.status == 200) {
		  json_str = res.json();
	      }
	      return json_str;
	  }).catch(function(err) {
              console.error(`fetch(): ${err}`);
          });
	    

	  if (response != null) {
	      const { text } = response.recognizedTextData;
	      //const audioFilename  = response.recordedAudioFilename;

	      const lang = props.configOptionsRef.current.lang;
	      //const lang_ti_recognised = props.configOptionsRef.current.interfaceText["_textInfoRecognisedTextSpoken_"][lang];
	      const lang_ti_recognised = interfaceTextResolver(props.configOptionsRef.current,"_textInfoRecognisedTextSpoken_",lang);
	      setText(lang_ti_recognised+": " + text);
	      
	      props.updateStatusCallback("_statusSpeechToTextCompleted_");
	      
	      //setAudioFilename(audioFilename);
	      // Do the following line if you want the audio to be played
	      //props.pageAudioFilenameCallback(audioFilename,blob,mimeType);
	      //props.playAudioBlobCallback(blob);
	      
	      // Now ask ChatLLM to respond to the recognised text
	      getPromptResponse(text,abortController);
	  }
      }
      catch (error) {
	  console.error(error);
      }
  };


    /* Some alternatives/variations on blobToBase64 */
    // **** XXXX Worth keeping these??
    // **** Perhaps just the StackOverflow URL?
    
/*
  const blobToBase64Async = (blob, callback) => {
      const reader = new FileReader();
      reader.onload = function () {
	  const type = blob.type;
	  const base64data = reader?.result?.split(",")[1];
	  callback(blob,base64data,type);
      };
      reader.readAsDataURL(blob);
  };
*/

    // https://stackoverflow.com/questions/18650168/convert-blob-to-base64
    /*
  function blobToBase64(blob) {
	return new Promise((resolve, _) => {
	    const reader = new FileReader();
	    reader.onloadend = () => resolve(reader.result);
	    reader.readAsDataURL(blob);
	});
    }
    */

    // **** XXXX
    /*
  const blobToBase64Promise = blob => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      return new Promise(resolve => {
	  reader.onloadend = () => {
	      resolve(reader.result);
	  };
      });
  };
    */
    
    
  const initializeMediaRecorder = (initStream) => {

      if (mediaRecorder === null) {
	  // This does get called twice, on page load
	  // The second stream is the one that ultimately gets stored in stream.current
	  // and subsequently used in startRecording()
	  
	  const audioMimeType = getOpenAISupportedMimeType();
	  
	  const thisMediaRecorder = new MediaRecorder(initStream, { mimeType: audioMimeType });

	  stream.current = initStream;

	  
	  //const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
	  //console.log("Creating mediaRecorder() from stream with sampleRate = " + sampleRate);
/*
	  thisMediaRecorder.onstart = () => {
	      console.log("mediaRecorder.onstart()");
	      audioContext.current = new AudioContext();
	      sourceNode.current = audioContext.current.createMediaStreamSource(stream);
	      analyzerNode.current = audioContext.current.createAnalyser();
	      sourceNode.current.connect(analyzerNode.current);
	      
	      const tick = () => {
		  
		  if (isRecording.current) {
		      const peak = getPeakLevel(analyzerNode.current);
		      const peak_boosted = Math.min(peak * 130,100); // give it a bit of a visual boost!
		      
		      const peak_perc = peak_boosted;
		      const peak_str = peak_perc.toFixed(0).toString();		  
		      setMicLevel(peak_str + "%");
		      
		      const peak_capped_perc = Math.min(peak_boosted,50); 
		      const peak_capped_str = peak_capped_perc.toFixed(0).toString();		  
		      setMicLevelCapped(peak_capped_str + "%");
		      
		      const peak_cliprect_top = 100 - peak_boosted;
		      const peak_cliprect_str = `rect(${peak_cliprect_top}% 100% 100% 0%)`;
		      setMicLevelCliprect(peak_cliprect_str)
		      
		      requestAnimationFrame(tick);
		  }
		  else {
		      sourceNode.current.disconnect();
		      audioContext.current.close();
		      setMicLevel("0%");
		      setMicLevelCapped("0%");
		      setMicLevelCliprect("rect(95% 100% 100% 0%)");
		  }
	      };
	      tick();
	      
	      chunks.current = [];
	  };
      
	  thisMediaRecorder.ondataavailable = (ev) => {
	      chunks.current.push(ev.data);
	  };
	  
	  thisMediaRecorder.onstop = () => {
	      console.log("mediaRecorder.onstop()");
	      const audioMimeType = thisMediaRecorder.mimeType;
	      console.log("audioMimeType = " + audioMimeType);
	      setAudioMimeType(audioMimeType);      
	      
	      const audioBlob = new Blob(chunks.current, { type: audioMimeType });
	      console.log("Converting chunks to blob:");
	      console.log(audioBlob);
	      //blobToBase64(audioBlob, getText);



	      const processAudioBlob = async () => {
		  const audioBlobBase64 = await blobToBase64Promise(audioBlob);
		  console.log("**** #### useRecordVoice.js, thisMediaRecorder.onstop():  props.lang = " + props.lang);
		  await getText(audioBlob,audioBlobBase64,audioMimeType);

	      };
	      processAudioBlob();

	      //
	      //blobToBase64Promise(audioBlob).then(audioBlobBase64 => {
	      //	  await getText(audioBlob,audioBlobBase64,audioMimeType);
	      //})
	      //
	      
	  };
*/
	  
	  setMediaRecorder(thisMediaRecorder);      
	  
      }
      
  };
    
    
  useEffect(() => {
      if (typeof window !== "undefined") {

	  if (typeof navigator.mediaDevices !== "undefined") {
	  
	      navigator.mediaDevices
		  .getUserMedia({ audio: true })
		  .then(initializeMediaRecorder);
	  }
	  else {
	      if (!window.isSecureContext) {
		  alert("Browser Window is not in a secure context (e.g. https, or localhost)\nUnable to access microphone for recording audio");
	      }
	      else {
		  alert("Unable to access mediaDevices");
	      }
	      // **** 
	      props.updateStatusCallback("_statusUnableToRecord_");
	  }
      }
  }, []);
    
    return { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text };
};
