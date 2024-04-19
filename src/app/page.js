"use client"

import React, { useState, useEffect  } from 'react';

import { Microphone } from "@/app/components/Microphone";

//import AudioPlayer from "react-modern-audio-player";

import dynamic from 'next/dynamic';

const AudioPlayer = dynamic(() => import('react-modern-audio-player'), {
  ssr: false,
});



export default function Home() {

    //const [isAudioPlayerLoaded, setAudioPlayerLoaded] = useState(false);
    const [audioFilename, setAudioFileanme] = useState(null);
    
    const playList = [];
/*
      {
	  name: 'Text-to-Speech recognised audio',
	  writer: 'OpenAI Whisper',
	  //img: 'image.jpg',
	  src: '/tmp/spoken-audio.webm',
	  id: 1,
      }
    ];
*/
    
    // https://stackoverflow.com/questions/66096260/why-am-i-getting-referenceerror-self-is-not-defined-when-i-import-a-client-side

    const audioFilenameCallback = (recordedAudioFilename) => {
	console.log("recordedAudioFilename = " + recordedAudioFilename)
	
	//setAudioFilename(recordedAudioFilename);
	//console.log("audioFilename (state) = " + audioFilename)

	const recordedAudioURL = recordedAudioFilename.replace(/public/, "");
	
	playList[0] = {
	    name:   'Text-to-Speech recognised audio',
	    writer: 'OpenAI Whisper',
	    src: recordedAudioURL,
	    id: 1
	};
    };
    
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
	    <Microphone  pageAudioFilenameCallback={audioFilenameCallback} />
	    <AudioPlayer playList={playList}/>
      </main>
  );
}
