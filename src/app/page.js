"use client"

import React, { useState, useEffect, useRef  } from 'react';

import { useRecordVoice } from "@/hooks/useRecordVoice";

import { Microphone  } from "@/app/components/Microphone";
import { AudioPlayer } from "@/app/components/AudioPlayer";

import { MediaPlayer, AudioSpectrumVisualizer } from "@/app/components/AudioSpectrumVisualizer";


//const DEBUG = true;
const DEBUG = false;

const RouterOptions = DEBUG ?
      {
	  fakeSpeechToText: true,
	  fakeChatGPT:      true,
	  fakeTextToSpeech: true
      }
      :
      {
	  fakeSpeechToText: false,
	  fakeChatGPT:      false,
	  fakeTextToSpeech: false
      };


export default function Home()
{
    const [statusText, setStatusText]       = useState("Status: waiting for audio input"); // <string>
    const [audioFilename, setAudioFilename] = useState(null);

    const [blob, setBlob]                 = useState(null); // <Blob>
    const [apBlob, setAudioPlayerBlob]             = useState(null); // <Blob> for AudioPlayer
    const [audioContext, setAudioContext] = useState(null); // <AudioContext>
    
    const mediaPlayer = useRef(null); // <MediaPlayer>
    
    const mediaPlayerWidth  = 400;
    const mediaPlayerHeight = 180;

    useEffect(() => {
	if (mediaPlayer.current === null) {
	    
	    mediaPlayer.current = new MediaPlayer(function() {
		// callback function, when audio stops playing
		console.log("mediaPlayer.onstopplaying() callback called!");
		setStatusText("Status: waiting for audio input");
                console.log("**** calling setBlob(null)");
		setBlob(null);
	    });

	}
    }, [])

    useEffect(() => {
	if (blob !== null) {
	    console.log(`[page.js] useEffect() [blob] non-null blob => setting mediaPlayer.state to "playing"`);
	    mediaPlayer.current.state = "playing";

            // Take a copy of the blob so the audio player can start/stop playing it
            setAudioPlayerBlob(blob);
	}
	else {
	    console.log(`[page.js] useEffect() [blob] blob is null  => setting mediaPlayer.state to "inactive"`);	    
	    mediaPlayer.current.state = "inactive"
	}
    }, [blob]);
  
    const updateStatusCallback = (text) => {
	setStatusText(text)
    };


    const handleAudioRewind = () => {
        console.log("handleAudioRewind()");
        if (mediaPlayer.current.state !== "inactive") {
            mediaPlayer.current.state = "rewind-to-beginning";
        }
    };

    const handleAudioPauseToggle = () => {
        console.log("handleAudioPauseToggle()");
        if (mediaPlayer.current.state === "playing") {
            mediaPlayer.current.state = "paused";
        }
        else {
            mediaPlayer.current.state = "playing";
        }
    };

    const handleAudioPlay = () => {
        console.log("handleAudioPlay()");
        if (mediaPlayer.current.state !== "playing") {
            //setBlob(null);
            mediaPlayer.current.state = "playing";
	    console.log("Initializing a new AudioContext");
	    setAudioContext(new AudioContext());
            setBlob(apBlob);
        }
    };

    const handleAudioStop = () => {
        console.log("handleAudioStop()");
        if ((mediaPlayer.current.state === "playing") || (mediaPlayer.current.state === "paused")) {
            mediaPlayer.current.state = "inactive";
	    setBlob(null);
        }
    };

   
    const audioFilenameCallback = (callbackAudioFilename, callbackBlob, callbackMimeType) => {
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
        
    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px", backgroundColor: 'white'}}>

	        <div className="flex flex-col justify-center items-center">
	          <div className="textmessage pb-2" style={{width: mediaPlayerWidth+"px"}}>
	            How can I help you today?
	          </div>	    	    

                  <div>
	            <AudioPlayer
                      mediaPlayer={mediaPlayer}
	              handleRewind={handleAudioRewind}
	              handlePauseToggle={handleAudioPauseToggle}
	              handlePlay={handleAudioPlay}
	              handleStop={handleAudioStop}
                    />
	            <div className="border border-black border-solid"
	                 style={{width: mediaPlayerWidth+'px', height: mediaPlayerHeight+'px', float: 'left'}}>
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
		      />
	            </div>
                    
                  </div>
	          <div className="textmessage text-sm p-2 mt-0 italic" style={{width: mediaPlayerWidth+'px', backgroundColor: "#F0F0F0"}} >
	            {statusText}
	          </div>
	    
	          <Microphone
	            routerOptions={RouterOptions}
	            pageAudioFilenameCallback={audioFilenameCallback}
		    pageStatusCallback={updateStatusCallback}
	          />
                </div>
	      </div>
	    </main>
  );
}


