"use client";

import React, { useState } from 'react';

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/components/IconMicrophone";

const Microphone = (props) => {    
    const { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text, statusText, audioFilename } = useRecordVoice(props);
    
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
	startRecording();
    };
 
    const handleMouseUp = () => {
        setIsMouseDown(false);
	stopRecording();
    };

    const micBackgroundColor = () => {
	if (isMouseDown) {
	    return 'rgb(230,10,10)';
	}
	else {
	    if (isHover) {
		return 'hsl(195, 53%, 84%)' // make it even lighter-blue
	    }
	    else {
		return 'hsl(195, 53%, 79%)' // lightblue
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
    }
			       
    
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

export { Microphone };
