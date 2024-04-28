"use client";

import React, { useState, useEffect } from 'react';

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/components/IconMicrophone";

const MicrophoneModeEnum = Object.freeze({"inactive":1, "recording":2});

const Microphone = (props) => {    
    const { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text, statusText } = useRecordVoice(props);

    const [microphoneMode, setMicrophoneMode] = useState(MicrophoneModeEnum.inactive);
    
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isHover,     setIsHover]     = useState(false);

    const handleMouseEnter = () => {
        setIsHover(true);
    };
 
    const handleMouseLeave = () => {
        setIsHover(false);
    };

    const handleMouseDown = () => {
        setIsMouseDown(true);
        setMicrophoneMode(MicrophoneModeEnum.recording);
	startRecording();
    };
 
    const handleMouseUp = () => {
        setIsMouseDown(false);
        setMicrophoneMode(MicrophoneModeEnum.inactive);
	stopRecording();
    };

    
    // atea-blue: #176593
    // rgb(23, 101, 147);
    // hsl(200, 80%, 46%)
    
    const micBackgroundColor = () => {
	if (isMouseDown) {
	    return 'rgb(230,10,10)'; // red for record!
	}
	else {
	    if (isHover) {
		return 'hsl(195, 53%, 84%)' // make it even lighter-blue
		//return 'hsl(200, 80%, 51%)' // make it even lighter atea-blue
	    }
	    else {
		return 'hsl(195, 53%, 79%)' // lightblue
		//return 'hsl(200, 80%, 46%)' // atea-blue
	    }
	}
    };
    
    const containerStyle = {
        backgroundColor: micBackgroundColor()
    };
    
    const lang_ = "en";
    // Language independent text messages
    const tm_how_to_record_ = {
	'en': "Press and hold the microphone button to record.",
	'mi': "Patōhia me te pupuri i te pātene hopuoro hei tuhi"
    };
			       
    
    //const micLevelStyle = {
    //    visibility: recording ? 'visible' : 'hidden'
    //};

    const micLevelStyle = {
        display: 'none'
    };

    return (
      <div className="flex flex-col justify-center items-center p-3">
        <button className="border-none bg-transparent w-14 rounded-full" style={containerStyle}
                 onMouseEnter={handleMouseEnter}
                 onMouseLeave={handleMouseLeave}
                 onMouseDown={handleMouseDown}
                 onMouseUp={handleMouseUp}
                 onTouchStart={handleMouseDown}
                 onTouchEnd={handleMouseUp}
                 onContextMenu={(e)=> e.preventDefault()} >
            <IconMicrophone micLevel={micLevelCapped} micLevelCliprect={micLevelCliprect} />
        </button>
	<p className="textmessage italic">{tm_how_to_record_[lang_]}</p>
	    
	<p style={micLevelStyle} >Mic level: {micLevel}</p>
	<p className="textmessage">{text}</p>

      </div>
  );
};

export { MicrophoneModeEnum, Microphone };
