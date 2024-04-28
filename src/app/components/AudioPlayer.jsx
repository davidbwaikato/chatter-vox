"use client";

import React, { useState, useEffect } from 'react';

import { IconRewind } from "@/app/components/IconRewind";
import { IconPause  } from "@/app/components/IconPause";
import { IconPlay   } from "@/app/components/IconPlay";
import { IconStop   } from "@/app/components/IconStop";

const AudioPlayerModeEnum = Object.freeze({"inactive":1, "playing":2, "paused":3});

const AudioPlayer = (props) => {    

    const [audioPlayerMode, setAudioPlayerMode] = useState(AudioPlayerModeEnum.inactive);
    
    const [isHover,     setIsHover] = useState(null); // To track which HTMLElemnt is being hovered over

    useEffect(() => {
        setAudioPlayerMode(props.autoAudioPlayerMode);
    }, [props.autoAudioPlayerMode]);


    const handleMouseEnter = (event) => {
        const enterElem = event.target;

        if ((audioPlayerMode === AudioPlayerModeEnum.playing) && (enterElem.id === "ap-play")) {
            return;
        }
        if ((audioPlayerMode === AudioPlayerModeEnum.paused) && (enterElem.id === "ap-pause")) {
            return;
        }

        if ((audioPlayerMode === AudioPlayerModeEnum.inactive) && (enterElem.id === "ap-stop")) {
            return;
        }
            
        setIsHover(enterElem);
        enterElem.style.backgroundColor = 'hsl(195, 53%, 84%)'; // make it even lighter-blue        
    };
 
    const handleMouseLeave = () => {
        if (isHover !== null) {
            isHover.style.backgroundColor = '';
            setIsHover(null);
        }
    };

    
    const playBackgroundColor = () => {
        if (audioPlayerMode === AudioPlayerModeEnum.playing) {
		return 'hsl(195, 53%, 84%)' // make it even lighter-blue
		//return 'hsl(200, 80%, 51%)' // make it even lighter atea-blue
        }
        else {
            return '';
        }
        /*
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
	}*/
    };


    const pauseBackgroundColor = () => {
        if (audioPlayerMode === AudioPlayerModeEnum.paused) {
	    return 'hsl(195, 53%, 84%)' // make it even lighter-blue
        }
        else {
            return '';
        }
    };
    
    const handlePlay = () => {
        //console.log("handlePlay()");
        setAudioPlayerMode(AudioPlayerModeEnum.playing);
        setIsHover(null);
        props.handlePlay();
    };
    
    const handlePauseToggle = () => {
        //console.log("handlePauseToggle()");
        if (props.mediaPlayer.current.state === "playing") {
            setAudioPlayerMode(AudioPlayerModeEnum.paused);
            setIsHover(null);
        }
        else {
            setAudioPlayerMode(AudioPlayerModeEnum.playing);
        }
        props.handlePauseToggle();
    };

    const handleStop = () => {
        //console.log("handleStop()");
        setAudioPlayerMode(AudioPlayerModeEnum.inactive);
        props.handleStop();
    };

    const playButtonStyle = {
        backgroundColor: playBackgroundColor()
    };

    const pauseButtonStyle = {
        backgroundColor: pauseBackgroundColor()
    };

    return(
        <span>
          <button
            id="ap-play"
            className="border-solid border-black border-2 bg-transparent w-10 rounded-full"
            style={playButtonStyle}
            onClick={handlePlay}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}            
          > 
	    <IconPlay/>
          </button>
          <button
            id="ap-pause"
            className="border-solid border-black border-2 bg-transparent w-10 rounded-full"
            style={pauseButtonStyle}            
            onClick={handlePauseToggle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}            
          >
	    <IconPause/>
            </button>
          <button
            id="ap-stop"
            className="border-solid border-black border-2 bg-transparent w-10 rounded-full"
            onClick={handleStop}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}            
          >
	    <IconStop/>                      
          </button>
        </span>
    );

};

export { AudioPlayerModeEnum, AudioPlayer };
