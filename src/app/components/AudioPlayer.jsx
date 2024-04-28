"use client";

import React, { useState } from 'react';

//import { useRecordVoice } from "@/hooks/useRecordVoice";
//import { IconMicrophone } from "@/app/components/IconMicrophone";

import { IconRewind } from "@/app/components/IconRewind";
import { IconPause  } from "@/app/components/IconPause";
import { IconPlay   } from "@/app/components/IconPlay";
import { IconStop   } from "@/app/components/IconStop";

const AudioPlayer = (props) => {    

/*
    const handleRewind = () => {
        console.log("handleRewind()");
        if (props.mediaPlayer.current.state !== "inactive") {
            props.mediaPlayer.current.state = "rewind-to-beginning";
        }
    };

    const handlePauseToggle = () => {
        console.log("handlePauseToggle()");
        if (props.mediaPlayer.current.state === "playing") {
            props.mediaPlayer.current.state = "paused";
        }
        else {
            props.mediaPlayer.current.state = "playing";
        }
    };

    
    const handlePlay = () => {
        console.log("handlePlay()");
        if (props.mediaPlayer.current.state !== "playing") {
            props.mediaPlayer.current.state = "playing";
        }
    };

    const handleStop = () => {
        console.log("handlePlay()");
        if (props.mediaPlayer.current.state === "playing") {
            props.mediaPlayer.current.state = "paused";
        }
    };

*/
    
    return(
                  <div style={{width: '40px', float: 'right'}} >
                    <button className="border-none bg-transparent w-10 rounded-full"
                            onClick={props.handleRewind}
                    >
                      <IconRewind/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full"
                            onClick={props.handlePauseToggle}
                    >
	              <IconPause/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full"
                            onClick={props.handlePlay}
                    >                      
	              <IconPlay/>
                    </button>
                    <button className="border-none bg-transparent w-10 rounded-full"
                            onClick={props.handleStop}
                    >
	              <IconStop/>                      
                    </button>
                  </div>
    );

};

export { AudioPlayer };
