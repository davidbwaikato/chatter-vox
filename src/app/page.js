"use client"

import React, { useState, useEffect  } from 'react';

import { Microphone } from "@/app/components/Microphone";

// https://stackoverflow.com/questions/66096260/why-am-i-getting-referenceerror-self-is-not-defined-when-i-import-a-client-side

import dynamic from 'next/dynamic';
const AudioPlayer = dynamic(() => import('react-modern-audio-player'), {
  ssr: false,
});

const initProgressType = "bar";
const initActiveUI = {
    playButton:   true,
    playList:     false,
    prevNnext:    false,
    volume:       true,
    volumeSlider: true,
    repeatType:   true,
    trackTime:    true,
    trackInfo:    false,
    artwork:      false
};

const initPlayList = [
    {
	name:   'Text-to-Speech recognised audio (default)',
	writer: 'OpenAI Whisper',
	src: "/default-audio-silence.mp3",
	id: 1
    },
    {
	name:   'Text-to-Speech recognised audio',
	writer: 'OpenAI Whisper',
	src: "/default-audio-silence.mp3",
	id: 2
    }
    
];


function AudioPlayerReady(props) {
    const audioFilename = props.audioFilename
    if (audioFilename !== null) {
	return <AudioPlayer {...props} />;
    }
    else {
	return;
    }
}

export default function Home() {

    //const [isAudioPlayerLoaded, setAudioPlayerLoaded] = useState(false);
    const [audioFilename, setAudioFilename] = useState(null);

    const [activeUI, setActiveUI]         = useState(initActiveUI);
    const [progressType, setProgressType] = useState(initProgressType);
    const [playList, setPlayList]         = useState([]);


    const audioFilenameCallback = (recordedAudioFilename) => {
	console.log("recordedAudioFilename = " + recordedAudioFilename)
	
	setProgressType("waveform");

	const recordedAudioURL = recordedAudioFilename.replace(/public/, "");
	
	const dynamicPlayList = [{
	    name:   'Text-to-Speech recognised audio',
	    writer: 'OpenAI Whisper',
	    src: recordedAudioURL,
	    id: 1
	}];
	setPlayList(dynamicPlayList);

	setAudioFilename(recordedAudioFilename);
	
    };

    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	    <div style={{width: "90%", maxWidth: "900px"}}>
	        <Microphone  pageAudioFilenameCallback={audioFilenameCallback} />
	        <AudioPlayerReady
	            audioFilename={audioFilename}
	            playList={playList}
	            activeUI={{
			...activeUI,
			progress: progressType
		    }}
	         />

	    </div>
	    </main>
  );
}
