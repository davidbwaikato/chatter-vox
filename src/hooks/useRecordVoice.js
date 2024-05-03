"use client";

import { useEffect, useState, useRef } from "react";
import { blobToBase64 } from "@/utils/blobToBase64";
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
    const chunks = useRef([]);
    const audioContext = useRef(null);
    const sourceNode   = useRef(null);
    const analyzerNode = useRef(null);

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
    
    const startRecording = () => {
	if (mediaRecorder) {
	    if (isRecording.current) {
		// Can end up in this situtation if the user has dragged the cursor out of the microphone area
		// and then let go.  Needs a further click on the micronphone icon to stop recording
		console.log("Already recording.  Interpretting this click event as a request to stop recording");
		stopRecording();
	    }
	    else {
		props.updateStatusCallback("Recording ...");
		
		isRecording.current = true;
		// Controlling the timeslice to .start() to be 1000, based on OpenAI Whisper <=> Safari issue
		//   https://community.openai.com/t/whisper-problem-with-audio-mp4-blobs-from-safari/322252
		mediaRecorder.start(1000);
		setRecording(true);
	    }
	}
    };
    
    const stopRecording = () => {
	if (mediaRecorder) {
	    props.updateStatusCallback("Stopped recording");
	    isRecording.current = false;
	    mediaRecorder.stop();
            setRecording(false);
	}
    };

    const getSynthesizedSpeech = async (text) => {
	props.updateStatusCallback(props.routerOptions.chatLLM + "'s response being synthesized as audio ...");
	
	try {
	    const response = await fetch("/api/textToSpeech", {
		method: "POST",
		headers: {
		    "Content-Type": "application/json",
		},
		body: JSON.stringify({
		    text: text,
		    routerOptions: props.routerOptions
		}),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
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
		      .then(response => response.blob());

		props.updateStatusCallback("Playing the synthesized audio response ...");
		props.playAudioBlobCallback(synthesizedAudioBlob);

	    }
	}
	catch (error) {
	    console.log(error);
	}
    };

    
    const getPromptResponse = async (promptText) => {
	props.updateStatusCallback("Recognised text being processed by " + props.routerOptions.chatLLM);
	//console.log("**** getPromptResponse");
	//console.log("     " + props.messagesRef.current);
	
	try {
	    const response = await fetch("/api/chatLLM", {
		method: "POST",
		headers: {
		    "Content-Type": "application/json",
		},
		body: JSON.stringify({
		    routerOptions: props.routerOptions,
		    //messages: JSON.parse(props.messages),
		    messages: props.messagesRef.current,
		    // //messages: messages,
		    promptText: promptText
		}),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
	    });

	    
	    if (response != null) {
		// The returned top message from ChatLMM
		const result_message_pair = response.result;
		console.log(result_message_pair);
		const chatResponseText = result_message_pair.returnedTopMessage.content;	    
		props.updateStatusCallback(props.routerOptions.chatLLM + "'s response received");
		props.updateMessagesCallback(result_message_pair);
		
		setText(props.routerOptions.chatLLM + " says: " + chatResponseText); // ****
		getSynthesizedSpeech(chatResponseText);		
	    }
	    else {		
		setText("No response received from " + props.routerOptions.chatLLM);
		props.updateStatusCallback("No response received from " + props.routerOptions.chatLLM);
	    }
	    
	}
	catch (error) {
	    setText("A network error occured when trying to process the recognised text");
	    props.updateStatusCallback("A network error occured");
	    
	    console.error(error);
	}
    };
    
    
    const getText = async (blob, base64data, mimeType) => {		    
	props.updateStatusCallback("Text recognition of recorded audio ...");
	
	try {
	  const response = await fetch("/api/speechToText", {
              method: "POST",
              headers: {
		  "Content-Type": "application/json",
              },
              body: JSON.stringify({
		  audio: base64data,
		  mimeType: mimeType,
		  routerOptions: props.routerOptions		  
              }),
	  }).then((res) => {
	      let json_str = null;
	      if (res.status == 200) {
		  json_str = res.json();
	      }
	      return json_str;
	  });

	  if (response != null) {
	      const { text } = response.recognizedTextData;
	      //const audioFilename  = response.recordedAudioFilename;
	      
	      setText("Recognised spoken text: " + text);
	      props.updateStatusCallback("Spoken text recognised");
	      
	      //setAudioFilename(audioFilename);
	      // Do the following line if you want the audio to be played
	      //props.pageAudioFilenameCallback(audioFilename,blob,mimeType);
	      //props.playAudioBlobCallback(blob);
	      
	      // Now ask ChatLLM to respond to the recognised text
	      getPromptResponse(text);
	  }
      }
      catch (error) {
	  console.error(error);
      }
  };

    
  const initializeMediaRecorder = (stream) => {

      if (mediaRecorder === null) {
	  const audioMimeType = getOpenAISupportedMimeType();
	  
	  const thisMediaRecorder = new MediaRecorder(stream, { mimeType: audioMimeType });
	  	  
	  //const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
	  //console.log("Creating mediaRecorder() from stream with sampleRate = " + sampleRate);

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
	      blobToBase64(audioBlob, getText);
	  };

	  setMediaRecorder(thisMediaRecorder);      
	  
      }
      
  };
    
    
  useEffect(() => {
      if (typeof window !== "undefined") {
	  navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then(initializeMediaRecorder);
      }
  }, []);
    
    return { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text };
};
