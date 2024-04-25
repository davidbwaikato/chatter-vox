"use client"

import React, { useState, useEffect  } from 'react';

import { Microphone } from "@/app/components/Microphone";

//import { AudioVisualizer }         from "@/app/components/AudioVisualizer";
//import { LiveAudioVisualizer }     from "@/app/components/LiveAudioVisualizer";
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
    //const [isAudioPlayerLoaded, setAudioPlayerLoaded] = useState(false);

    const [statusText, setStatusText]       = useState("Status: waiting for audio input"); // <string>
    const [audioFilename, setAudioFilename] = useState(null);

    const [blob, setBlob]       = useState(null); // <Blob>
    const [context, setContext] = useState(null); // <AudioContext>
    
    const mediaPlayer = new MediaPlayer(function() {
        // callback function, when audio stops playing
	console.log("***** mediaPlayer.onstopplaying() called!!");
	setStatusText("Status: waiting for audio input");
	setBlob(null);
    });

    const mediaPlayerWidth  = 400;
    const mediaPlayerHeight = 180;

    const updateStatusCallback = (text) => {
	setStatusText(text)
    };

   
    const audioFilenameCallback = (recordedAudioFilename, recordedBlob, recordedMimeType) => {
	console.log("[page.js] recordedAudioFilename = " + recordedAudioFilename)
	
	const recordedAudioURL = recordedAudioFilename.replace(/public/, "");
	
	setAudioFilename(recordedAudioFilename);
	//mediaPlayer.state = "start-playing";
	//mediaPlayer.state = "init-to-silence";

        if (context === null) {
            console.log("Initializing AudioContext");
            setContext(new AudioContext());
        }
	console.log("[page.js] Setting blob to recorded Audio");
	setBlob(recordedBlob);
	
	/*
	// https://codepen.io/SitePoint/pen/JRaLVR
	// https://stackoverflow.com/questions/40363335/how-to-create-an-audiobuffer-from-a-blob

	const audioBuffer = await fetch(audioURL)
	      .then(response => response.arrayBuffer())
	      .then(arrayBuffer => context.decodeAudioData(arrayBuffer));

	*/
    };

    
    
    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px", backgroundColor: 'white'}}>

	        <div className="flex flex-col justify-center items-center">
	          <div className="textmessage pb-2" style={{width: mediaPlayerWidth+"px"}}>
	            How can I help you today?
	          </div>	    	    

                  <div>
                  <div style={{width: '40px', float: 'right'}} >
                    <button className="border-none bg-transparent w-10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           id="rewind"
                           viewBox="0 0 80 80">
                        <g>
                          <path
                            d="M39.75,5.5C20.834,5.5,5.5,20.834,5.5,39.75C5.5,58.666,20.834,74,39.75,74C58.666,74,74,58.666,74,39.75   C74,20.834,58.666,5.5,39.75,5.5z M39.75,70C23.043,70,9.5,56.457,9.5,39.75C9.5,23.043,23.043,9.5,39.75,9.5   C56.457,9.5,70,23.043,70,39.75C70,56.457,56.457,70,39.75,70z" />
                          <g transform="translate(2.7884615,0.09615385)">
                            <path
                              d="m 29.265203,40.480769 25.2,-14.4 v 28.8 z"
                              style={{fill:'#000000',stroke:'#000000',strokeWidth:3.2,strokeLinejoin:'round',strokeMiterlimit:4,strokeDasharray:'none',strokeOpacity:1}} />
                            <path
                              d="m 26.75,52.389423 c 0,2.348 -1.903,4.25 -4.25,4.25 v 0 c -2.347,0 -4.25,-1.902 -4.25,-4.25 v -23.625 c 0,-2.347 1.903,-4.25 4.25,-4.25 v 0 c 2.347,0 4.25,1.903 4.25,4.25 z" />
                          </g>
                        </g>
                      </svg>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           id="pause"
                           viewBox="0 0 80 80">
                        <g>
                          <path
                            d="M39.75,5.5C20.834,5.5,5.5,20.834,5.5,39.75C5.5,58.666,20.834,74,39.75,74C58.666,74,74,58.666,74,39.75   C74,20.834,58.666,5.5,39.75,5.5z M39.75,70C23.043,70,9.5,56.457,9.5,39.75C9.5,23.043,23.043,9.5,39.75,9.5   C56.457,9.5,70,23.043,70,39.75C70,56.457,56.457,70,39.75,70z" />
                          <path
                            d="M37.125,52.375c0,2.348-1.903,4.25-4.25,4.25l0,0c-2.347,0-4.25-1.902-4.25-4.25V28.75c0-2.347,1.903-4.25,4.25-4.25l0,0   c2.347,0,4.25,1.903,4.25,4.25V52.375z" />
                          <path
                            d="M51.125,52.375c0,2.348-1.902,4.25-4.25,4.25l0,0c-2.348,0-4.25-1.902-4.25-4.25V28.75c0-2.347,1.902-4.25,4.25-4.25l0,0   c2.348,0,4.25,1.903,4.25,4.25V52.375z" />
                        </g>
                      </svg>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           id="play"
                           viewBox="0 0 80 80">
                        <g>
                          <path
                            d="M39.75,5.5C20.834,5.5,5.5,20.834,5.5,39.75C5.5,58.666,20.834,74,39.75,74C58.666,74,74,58.666,74,39.75   C74,20.834,58.666,5.5,39.75,5.5z M39.75,70C23.043,70,9.5,56.457,9.5,39.75C9.5,23.043,23.043,9.5,39.75,9.5   C56.457,9.5,70,23.043,70,39.75C70,56.457,56.457,70,39.75,70z" />
                          <path
                            d="m 54.465365,40.480769 -25.2,-14.4 v 28.8 z"
                            style={{fill:'#000000',stroke:'#000000',strokeWidth:3.2,strokeLinejoin:'round',strokeMiterlimit:4,strokeDasharray:'none',strokeOpacity:1}} />                            
                        </g>                        
                      </svg>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           id="stop"
                           viewBox="0 0 80 80">

                        <g>
                          <path
                            d="M39.75,5.5C20.834,5.5,5.5,20.834,5.5,39.75C5.5,58.666,20.834,74,39.75,74C58.666,74,74,58.666,74,39.75   C74,20.834,58.666,5.5,39.75,5.5z M39.75,70C23.043,70,9.5,56.457,9.5,39.75C9.5,23.043,23.043,9.5,39.75,9.5   C56.457,9.5,70,23.043,70,39.75C70,56.457,56.457,70,39.75,70z" />
                          <rect
                            style={{fill:'#000000',stroke:'#000000',strokeWidth:3.2,strokeLinejoin:'round',strokeMiterlimit:4,strokeDasharray:'none',strokeOpacity:1}}
                            width="27.884615"
                            height="28.076923"
                            x="26.73077"
                            y="26.153847" />
                        </g>
                      </svg>
                    </button>
                  </div>
	          <div className="border border-black border-solid"
	style={{width: mediaPlayerWidth+'px', height: mediaPlayerHeight+'px', float: 'left'}}>
		      <AudioSpectrumVisualizer
		        mediaPlayer={mediaPlayer}
	                blob={blob}
	                context={context}
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


