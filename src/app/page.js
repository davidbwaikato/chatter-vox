"use client"

import React, { useState, useEffect  } from 'react';

import { Microphone } from "@/app/components/Microphone";
import { IconRewind } from "@/app/components/IconRewind";
import { IconPause  } from "@/app/components/IconPause";
import { IconPlay   } from "@/app/components/IconPlay";
import { IconStop   } from "@/app/components/IconStop";

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
                      <IconRewind/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
	              <IconPause/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
	              <IconPlay/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full">
	              <IconStop/>                      
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


