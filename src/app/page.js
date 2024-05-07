"use client"

import React, { useState, useEffect, useRef  } from 'react';

import { useRecordVoice } from "@/hooks/useRecordVoice";

import { MicrophoneModeEnum,  Microphone  } from "@/app/components/Microphone";
import { AudioPlayerModeEnum, AudioPlayer } from "@/app/components/AudioPlayer";

import { MediaPlayer, AudioSpectrumVisualizer } from "@/app/components/AudioSpectrumVisualizer";



const ConfigOptions = {
    speechToText : "PapaReo",
    chatLLM      : "Claude",
    textToSpeech : "PapaReo",    
};
      

const Lang = "mi";

const InterfaceText = {

    _howCanIHelp_: {
	"en": "How can I help you today?",
	"mi": "Kōrero mai ..."
    },
    _microphoneInstructions_: {
	"en": "Press and hold the microphone button to record.",
	"mi": "pātene hopu reo."
    },

    _statusLabel_: {
	"en": "Status",
	//"mi": "<?Translation for Status?>"
	"mi": "Tūnga"
    },
    _statusWaiting_: {
	"en": "Waiting for audio input ...",
	"mi": "E whanga ana ki tō reo ..."
    },
    _statusRecording_: {
	"en": "Recording ...",
	"mi": "E hopu ana ..."
    },
    _statusSpeechToTextProcessing_: {
	"en": "Text recognition of recorded audio ...",
	"mi": "E whakarite ana te kupu kōrero ki te kupu tuhi..."
    },
    _statusChatLLMProcessing_: {
	"en": "Recognised text being processed by Claude ...",
	"mi": "E hanga whakaaro ana a Claude ...",
    },
    _statusTextToSpeechProcessing_: {
	"en": "Claude's response being synthesized as audio ...",
	"mi": "E whakarite ana te kupu tuhi ki te kupu kōrero ..."
    },
    _statusPlayingSynthesizedResult_: {
	"en": "Playing the synthesized audio response ...",
	"mi": "E kōrero ana ..."
    },
    _LLMSays_: {
	"en": "Claude says",
	"mi": "ki tā Claude"
    }
};

ConfigOptions["interfaceText"] = InterfaceText;
ConfigOptions["lang"] = Lang;

const InterfaceModeEnum = Object.freeze({"inactive":1, "recording": 2, "playing":3, "paused":4 });

export default function Home()
{
    const [interfaceMode,   setInterfaceMode]   = useState(InterfaceModeEnum.inactive);
    const [microphoneMode,  setMicrophoneMode]  = useState(MicrophoneModeEnum.inactive);
    const [audioPlayerMode, setAudioPlayerMode] = useState(AudioPlayerModeEnum.inactive);

    //const defaultStatusText = "Waiting for audio input";
    const defaultStatusText = InterfaceText["_statusWaiting_"][Lang];
    const [statusText, setStatusText]     = useState(InterfaceText["_statusLabel_"][Lang] + ": " + defaultStatusText);

    const [blob, setBlob]                 = useState(null); // <Blob>
    const [apBlob, setAudioPlayerBlob]    = useState(null); // <Blob> for AudioPlayer
    const [audioContext, setAudioContext] = useState(null); // <AudioContext>

    const [messages, setMessages] = useState([
        { role: "system",    content: "You are a helpful assistant" },
        { role: "assistant", content: "How can I you today?" }
    ]);
    const messagesRef = useRef(null);
    
    const mediaPlayer = useRef(null); // <MediaPlayer>
    
    const mediaPlayerWidth     = 400;
    const mediaPlayerHeight    = 132;
    const audioControllerWidth = 46;

    const interfaceWidth = mediaPlayerWidth + audioControllerWidth;
    
    
    useEffect(() => {
	if (mediaPlayer.current === null) {
	    
	    mediaPlayer.current = new MediaPlayer(function() {
		// callback function, when audio stops playing
		console.log("mediaPlayer.onstopplaying() callback called!");
		updateStatus(defaultStatusText);
                setBlob(null);
	    });

	}
    }, []);

    useEffect(() => {
	if (blob !== null) {
	    console.log(`[page.js] useEffect() [blob] non-null blob => setting mediaPlayer.state to "playing"`);
            setInterfaceMode(InterfaceModeEnum.playing);
	    mediaPlayer.current.state = "playing";

            // Take a copy of the blob so the audio player can start/stop playing it
            setAudioPlayerBlob(blob);
	}
	else {
	    console.log(`[page.js] useEffect() [blob] blob is null  => setting mediaPlayer.state to "inactive"`);
            setInterfaceMode(InterfaceModeEnum.inactive);            
	    mediaPlayer.current.state = "inactive";
	}
    }, [blob]);

    useEffect(() => {
        if (interfaceMode === InterfaceModeEnum.inactive) {
            setMicrophoneMode(MicrophoneModeEnum.inactive);
            setAudioPlayerMode(AudioPlayerModeEnum.inactive);
        }
        else if (interfaceMode === InterfaceModeEnum.recording) {
            setMicrophoneMode(MicrophoneModeEnum.recording);
            setAudioPlayerMode(AudioPlayerModeEnum.inactive);
        }            
        else if (interfaceMode === InterfaceModeEnum.playing) {
            setMicrophoneMode(MicrophoneModeEnum.inactive);            
            setAudioPlayerMode(AudioPlayerModeEnum.playing);
        }
        else if (interfaceMode === InterfaceModeEnum.paused) {
            setMicrophoneMode(MicrophoneModeEnum.inactive);            
            setAudioPlayerMode(AudioPlayerModeEnum.paused);
        }        
    }, [interfaceMode]);


    useEffect(() => {
	messagesRef.current = messages;
    }, [messages]);
    
    const updateStatus = (text_marker) => {
	let lang_text = text_marker;
	
	if (text_marker in InterfaceText) {
	    
	    lang_text = InterfaceText[text_marker][Lang];
	}

	const status_label = InterfaceText["_statusLabel_"][Lang];
	setStatusText(status_label+ ": " + lang_text)
    };

    const handleAudioPauseToggle = () => {
        console.log("handleAudioPauseToggle()");
        if (mediaPlayer.current.state === "playing") {
            mediaPlayer.current.state = "paused";
	    updateStatus("Paused"); // NT
        }
        else {
            mediaPlayer.current.state = "playing";
	    updateStatus("Playing ..."); // NT           
        }
    };

    const handleAudioPlay = () => {
        console.log("handleAudioPlay()");
        if (mediaPlayer.current.state !== "playing") {
            mediaPlayer.current.state = "playing";
	    updateStatus("Playing ..."); // NT
            
	    console.log("Initializing a new AudioContext");
	    setAudioContext(new AudioContext());
            setBlob(apBlob);
        }
    };

    const handleAudioStop = () => {
        console.log("handleAudioStop()");
        if ((mediaPlayer.current.state === "playing") || (mediaPlayer.current.state === "paused")) {
            mediaPlayer.current.state = "inactive";
	    updateStatus("Stopped playing"); // NT
            
	    setBlob(null);
        }
    };

   
    const audioFilenameCallbackDeprecated = (callbackAudioFilename, callbackBlob, callbackMimeType) => {
	console.log("[page.js] callbackAudioFilename = " + callbackAudioFilename)
	
	const callbackAudioURL = callbackAudioFilename.replace(/public/, "");
	
	setAudioFilename(callbackAudioFilename);
	//mediaPlayer.current.state = "start-playing";
	//mediaPlayer.current.state = "init-to-silence";

        if (audioContext === null) {
            console.log("Initializing AudioContext");
            setAudioContext(new AudioContext());
        }
	setBlob(callbackBlob);
    };


    const playAudioBlobCallback = (callbackBlob) => {
	console.log("[page.js] playAudioBlobCallback()");
	
	//const callbackAudioURL = callbackAudioFilename.replace(/public/, "");
	
	//setAudioFilename(callbackAudioFilename);

        if (audioContext === null) {
            console.log("Initializing AudioContext");
            setAudioContext(new AudioContext());
        }
	setBlob(callbackBlob);

    };

    const updateMessagesCallback = (returnedMessagePair) => {
        console.log("returnedMessagePair = " + JSON.stringify(returnedMessagePair));
        const userMessage        = returnedMessagePair.userMessage;
        const returnedTopMessage = returnedMessagePair.returnedTopMessage;

        const updatedMessages = [...messages, userMessage, returnedTopMessage];
        setMessages(updatedMessages);	        
    };

    const lang_HowCanIHelp = InterfaceText["_howCanIHelp_"][Lang];
    
    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px", backgroundColor: 'white'}}>

	        <div className="flex flex-col justify-center items-center">
	          <div className="textmessage pb-2" style={{width: interfaceWidth+'px'}} >                  
	            {lang_HowCanIHelp}
	          </div>	    	    

                  <div style={{backgroundColor: '#f4f4f4', padding: '0.5rem 0.5rem 0 0.5rem'}}>
                    <div style={{width: audioControllerWidth+'px', float: 'left'}} >
                      <div style={{margin: '0.2rem'}}>
	                <AudioPlayer
                          mediaPlayer={mediaPlayer}
	                  autoAudioPlayerMode={audioPlayerMode}
	                  handlePauseToggle={handleAudioPauseToggle}
	                  handlePlay={handleAudioPlay}
	                  handleStop={handleAudioStop}
        		  updateStatusCallback={updateStatus}
                        />
                      </div>
                    </div>
	            <div className="border border-solid"
	                 style={{width: mediaPlayerWidth+'px', height: mediaPlayerHeight+'px',
                                 backgroundColor: 'white', borderColorXX: 'black', float: 'right'}}>
		      <AudioSpectrumVisualizer
		        mediaPlayer={mediaPlayer}
	                blob={blob}
	                audioContext={audioContext}
                        fftSize={256}
		        width={mediaPlayerWidth}
		        height={mediaPlayerHeight}
		        barWidth={3}
		        gap={2}
		        barColor={'lightblue'}
        		updateStatusCallback={updateStatus}                        
		      />
	            </div>
                    
                  </div>
                  <div style={{backgroundColor: '#f4f4f4', padding: '0 0.5rem 0 0.5rem'}}>
	            <div className="textmessage text-sm p-2 mt-0 italic"
                         style={{width: interfaceWidth+'px', color: 'black', borderColorXX: '#176593'}} >
	              {statusText}
	            </div>
	          </div>
	          <Microphone
	            configOptions={ConfigOptions}
                    messagesRef={messagesRef}
		    updateStatusCallback={updateStatus}
	            playAudioBlobCallback={playAudioBlobCallback}
                    updateMessagesCallback={updateMessagesCallback}
	          />
                </div>
	      </div>
	    </main>
  );
}


