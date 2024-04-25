"use client";

import { useEffect, useState, useRef } from "react";
import { blobToBase64 } from "@/utils/blobToBase64";
import { getPeakLevel } from "@/utils/createMediaStream";

export const useRecordVoice = (props) => {
    const [text, setText]             = useState("");
    //const [statusText, setStatusText] = useState("");
    
    const [audioMimeType, setAudioMimeType] = useState("");
    const [audioFilename, setAudioFilename] = useState(null);

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

    /*
    useEffect(() => {
	if (statusText !== "") {
	    props.pageStatusCallback("Status: " + statusText);
	}
    }, [statusText])
    */
    
    const setStatusTextCB = (text) => {
	props.pageStatusCallback("Status: " + text);	
    };

    // OpenAI supported audio formats:
    //   ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']"

    const getOpenAISupportedMimeType = () => {
	const supported_formats = [
	    "audio/ogg;codecs=opus",
	    "audio/webm;codecs=opus",
	    "audio/webm",
	    "audio/ogg"
	];

	let return_format = "";
	
	for (const format of supported_formats) {
	    console.log("**** checking MIME type: " + format);
	    if (MediaRecorder.isTypeSupported(format)) {
		return_format = format;
		break;
	    }
	}

	if (return_format === "") {
	    console.error("Failed to find browser supported audio MIME-type that is compatible with OpenAI's transcribe service");
	}

	console.log("Away to return mimeType: " + return_format);
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
		setStatusTextCB("Recording ...");
		
		isRecording.current = true;
		mediaRecorder.start();
		setRecording(true);
	    }
	}
    };
    
    const stopRecording = () => {
	if (mediaRecorder) {
	    setStatusTextCB("Stopped recording");
	    isRecording.current = false;
	    mediaRecorder.stop();
            setRecording(false);
	}
    };

    const getSynthesizedSpeech = async (text) => {
	setStatusTextCB("ChatGPT response being synthesized as audio ...");
	
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

	    //console.log("getSynthesizedSpeech() API Response:")
	    //console.log(response);
	    
	    if (response != null) {
		const synthesizedAudioFilename = response.synthesizedAudioFilename;
		//const synthesizedAudioBlob     = response.synthesizedAudioBlob;
		const synthesizedAudioMimeType = response.synthesizedAudioMimeType;
	    
		console.log("synthesizedAudioFilename: " + synthesizedAudioFilename);

		const synthesizedAudioURL = synthesizedAudioFilename.replace(/public/,"")
		
		const synthesizedAudioBlob = await fetch(synthesizedAudioURL)
		      .then(response => response.blob());
		console.log("[useRecordVoice.js] synthesizedAudioBlob:");
		console.log(synthesizedAudioBlob);
		
		setAudioFilename(synthesizedAudioFilename);

		setStatusTextCB("Playing the synthesized audio response ..."); // ****
		props.pageAudioFilenameCallback(synthesizedAudioFilename,synthesizedAudioBlob,synthesizedAudioMimeType);

	    }
	}
	catch (error) {
	    console.log(error);
	}
    };


    
    const getPromptResponse = async (promptText) => {
	//setText("Recognised text: " + promptText + " => Now being processing by ChatGPT");
	setStatusTextCB("Recognised text being processed by ChatGPT");

	try {
	    const response = await fetch("/api/chatGPT", {
		method: "POST",
		headers: {
		    "Content-Type": "application/json",
		},
		body: JSON.stringify({
		    promptText: promptText,
		    routerOptions: props.routerOptions		    
		}),
	    }).then((res) => {
		let json_str = null;
		if (res.status == 200) {
		    json_str = res.json();
		}
		return json_str;
	    });

	    //console.log(response);
	    
	    if (response != null) {
		const result = response.result;
		console.log(result);
		const chatResponseText = result.content;	    
		setStatusTextCB("ChatGPT response received");
		
		setText("ChatGPT says: " + chatResponseText);		
		getSynthesizedSpeech(chatResponseText);		
	    }
	    else {		
		setText("No response received from ChatGPT");
		setStatusTextCB("No response received from ChatGPT");
	    }
	    
	}
	catch (error) {
	    setText("A network error occured when trying to process the recognised text");
	    setStatusTextCB("A network error occured");
	    
	    console.error(error);
	}
    };
    
    
    const getText = async (blob, base64data, mimeType) => {
		    
	setStatusTextCB("Text recognition of recorded audio ...");
	
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
	      const audioFilename  = response.recordedAudioFilename;
	      
	      setText("Recognised spoken text: " + text);
	      setStatusTextCB("Spoken text recognised");
	      
	      setAudioFilename(audioFilename);
	      // Do the following line if you want the audio to be played
	      //props.pageAudioFilenameCallback(audioFilename,blob,mimeType);

	      // Now ask ChatGPT to respond to the recognised text
	      getPromptResponse(text);
	  }
      }
      catch (error) {
	  console.log(error);
      }
  };

  let newMediaRecorder = null;
    
  const initialMediaRecorder = (stream) => {

      //console.log("newMediaRecorder:" + newMediaRecorder);
      //console.log(mediaRecorder);

      if (newMediaRecorder === null) {
	  const audioMimeType = getOpenAISupportedMimeType();
	  console.log("Away to create MediaRecorder with mimeType = " + audioMimeType);
	  
	  newMediaRecorder = new MediaRecorder(stream, { mimeType: audioMimeType });
	  
	  console.log("**** MIME-type = " + newMediaRecorder.mimeType);
	  
	  
	  //const sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate;
	  //console.log("Creating mediaRecorder() from stream with sampleRate = " + sampleRate);

	  newMediaRecorder.onstart = () => {
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
      
	  newMediaRecorder.ondataavailable = (ev) => {
	      chunks.current.push(ev.data);
	  };
	  
	  newMediaRecorder.onstop = () => {
	      console.log("mediaRecorder.onstop()");
	      const audioMimeType = newMediaRecorder.mimeType;
	      console.log("audioMimeType = " + audioMimeType);
	      setAudioMimeType(audioMimeType);      
	      
	      const audioBlob = new Blob(chunks.current, { type: audioMimeType });
	      console.log("Converting chunks to blob:");
	      console.log(audioBlob);
	      blobToBase64(audioBlob, getText);
	  };

	  setMediaRecorder(newMediaRecorder);      
	  
      }
      
  };

  useEffect(() => {
      if (typeof window !== "undefined") {
	  navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then(initialMediaRecorder);
      }
  }, []);
    
    return { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text, audioFilename };
};
