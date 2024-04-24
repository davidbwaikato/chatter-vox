"use client"

import React, { useState, useEffect  } from 'react';

import { Microphone } from "@/app/components/Microphone";

import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
//import { AudioVisualizer, LiveAudioVisualizer } from 'react-audio-visualize';

import { AudioVisualizer }         from "@/app/components/AudioVisualizer";
import { LiveAudioVisualizer }     from "@/app/components/LiveAudioVisualizer";
//import { MediaPlayer, AudioSpectrumVisualizer } from "@/app/components/AudioSpectrumVisualizer";

import { AudioSpectrumVisualizer } from "@/app/components/AudioSpectrumVisualizer";
import { MediaPlayer } from "@/app/components/AudioSpectrumVisualizer/MediaPlayer";

/*
const RouterOptions = {
    fakeSpeechToText: true,
    fakeChatGPT:      true,
    fakeTextToSpeech: true
};
*/


const RouterOptions = {
    fakeSpeechToText: false,
    fakeChatGPT:      false,
    fakeTextToSpeech: false
};


export default function Home() {
//function HomeProd() {

    //const [isAudioPlayerLoaded, setAudioPlayerLoaded] = useState(false);
    const [audioFilename, setAudioFilename] = useState(null);

    const [blob, setBlob] = useState(null); // <Blob>

    const mediaPlayer = new MediaPlayer();

    const mediaPlayerWidth  = 400;
    const mediaPlayerHeight = 120;
    
    const audioFilenameCallback = (recordedAudioFilename, recordedBlob, recordedMimeType) => {
	console.log("[page.js] recordedAudioFilename = " + recordedAudioFilename)
	
	const recordedAudioURL = recordedAudioFilename.replace(/public/, "");
	
	setAudioFilename(recordedAudioFilename);
	mediaPlayer.state = "start-playing";
	console.log("[page.js] Setting blob to recorded Audio");
	setBlob(recordedBlob);

	/*
	// https://codepen.io/SitePoint/pen/JRaLVR
	// https://stackoverflow.com/questions/40363335/how-to-create-an-audiobuffer-from-a-blob

	const audioBuffer = await fetch(audioURL)
	      .then(response => response.arrayBuffer())
	      .then(arrayBuffer => context.decodeAudioData(arrayBuffer));

	*/
    }

    useEffect(() => {
    
	const audioSilenceURL = "/default-audio-silence.mp3";
	
	window.fetch(audioSilenceURL)
	    .then(response => {
		if (response.ok) {
		    return response.blob();
		}
		throw new Error('Failed to retrieve: ' + audioSilenceURL);
	    })
	    .then(audioBlob => {
		setBlob(audioBlob);
	    })
	    .catch(function(error) {
		console.log('There has been a problem with your fetch operation: ', error.message);
	    });
    }, [])


    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px"}}>

	        <div className="flex flex-col justify-center items-center">
	          <div className="border border-black border-solid"
	               style={{width: mediaPlayerWidth+'px', height: mediaPlayerHeight+'px'}}>
	            {blob && (
		      <AudioSpectrumVisualizer
		         mediaPlayer={mediaPlayer}
		         blob={blob}
		         width={mediaPlayerWidth}
		         height={mediaPlayerHeight}
		         barWidth={3}
		         gap={2}
		         barColor={'lightblue'}
		      />
		    )}
	          </div>
	          <Microphone
	             routerOptions={RouterOptions}
	             pageAudioFilenameCallback={audioFilenameCallback}
	          />
                </div>
	      </div>
	    </main>
  );
}





//export default function Home() {
function HomeDev() {
  const [blob, setBlob] = useState(); // <Blob>
  const recorder = useAudioRecorder();

  return (
    <div>
      <AudioRecorder
        onRecordingComplete={setBlob}
        recorderControls={recorder}
      />

      {recorder.mediaRecorder && (
        <LiveAudioVisualizer
          mediaRecorder={recorder.mediaRecorder}
          width={200}
          height={75}
        />
      )}

      {blob && (
        <AudioVisualizer
          blob={blob}
          width={500}
          height={75}
          barWidth={1}
          gap={0}
          barColor={'#f76565'}
        />
      )}

      {blob && (
        <AudioVisualizer
          blob={blob}
          width={500}
          height={75}
          barWidth={3}
          gap={2}
          barColor={'lightblue'}
        />
      )}
    </div>
  );
}

