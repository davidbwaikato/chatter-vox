"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import { cssSettingResolver } from "@/utils/configOptionsResolver";

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/components/IconMicrophone";

import Markdown from 'react-markdown';

const MicrophoneModeEnum = Object.freeze({"inactive":1, "recording":2, "disabled":3 });

const Microphone = forwardRef((props,ref) => {    
    const { recording, startRecording, stopRecording, micLevel, micLevelCapped, micLevelCliprect, text, statusText } = useRecordVoice(props);

    const [microphoneMode, setMicrophoneMode] = useState(MicrophoneModeEnum.inactive);
    
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isHover,     setIsHover]     = useState(false);

    const [showText,    setShowText]    = useState(false);

    useImperativeHandle(ref, () => ({
	updateMicrophoneMode(newState) {
	    setMicrophoneMode(newState);
	},
    }));
			
    const handleMouseEnter = () => {
	if (microphoneMode != MicrophoneModeEnum.disabled) {	
            setIsHover(true);
	}
    };
 
    const handleMouseLeave = () => {
        setIsHover(false);
    };

    const handleMouseDown = () => {
	if (microphoneMode != MicrophoneModeEnum.disabled) {	
            setIsMouseDown(true);
            setMicrophoneMode(MicrophoneModeEnum.recording);
	    startRecording(props.abortControllerRef.current);
	}
    };
 
    const handleMouseUp = () => {
	if (microphoneMode != MicrophoneModeEnum.disabled) {	
            setIsMouseDown(false);
            setMicrophoneMode(MicrophoneModeEnum.inactive);
	    stopRecording();
	}
    };

    // For (historical) reference ...
    // atea-blue: #176593
    //   rgb(23, 101, 147);
    //   hsl(200, 80%, 46%)
    
    const micBackgroundColor = () => {
	let return_val = null;

	const configOptions = props.configOptionsRef.current;
	
	if (microphoneMode == MicrophoneModeEnum.disabled) {
	    // Originally set to be grey [rgb(200,200,200)] for disabled
	    return_val = cssSettingResolver(configOptions,"micBackgroundDisabledColor");
	    //return 'rgb(200,200,200)'; // grey for disabled
	}	
	else if (isMouseDown) {
	    // Originally set to be red [rgb(230,10,10)] for record! 
	    return_val = cssSettingResolver(configOptions,"micBackgroundRecordColor");
	    //return 'rgb(230,10,10)'; // red for record!
	}
	else {
	    if (isHover) {
		// Originally set to be a lighter-blue through HSL [hsl(195, 53%, 85%)]
		return_val = cssSettingResolver(configOptions,"micBackgroundHoverColor");
		//return 'hsl(195, 53%, 85%)' // make it even lighter-blue
	    }
	    else {
		// Originally set to be 'lightblue' [hsl(195, 53%, 80%)]
		return_val = cssSettingResolver(configOptions,"micBackgroundColor");
		//return 'hsl(195, 53%, 80%)' // lightblue
	    }
	}

	return return_val;
    };
    
    const containerStyle = {
        backgroundColor: micBackgroundColor()
    };

    const lang_  = props.configOptionsRef.current.lang;
    const it_microphoneInstructions = props.configOptionsRef.current.interfaceText["_microphoneInstructions_"];
    
    //const micLevelStyle = {
    //    visibility: recording ? 'visible' : 'hidden'
    //};

    const micLevelStyle = {
        display: 'none'
    };

    const showTextBlockCheck = () => {
        if (text && text !== "") {
            return 'block';
        }
        else {
            return 'none';
        }
    };

    
    const showTextBlockStyle = {
        //minWidth: '446px',
        display: showTextBlockCheck()
    };


    const showTextMessageCheck = () => {
        if (showText) {
            return 'block';
            /*
            return {
                maxHeight: "500px",
                transition: "max-height 2.5s ease-in"
            };
*/

            
        }
        else {
            return 'none';
            /*
            return {
                maxHeight: 0,
                transition: "max-height 1.5s ease-out",
                overflow: "hidden",
            };
            */
        }
    };

    
    const showTextMessageStyle = {
        display: showTextMessageCheck()
    };
    

    //const showTextMessageStyle = showTextMessageCheck();
    
    const handleShowHideToggle = (event) => {
        if (showText) {
            console.log("Changing showText from true to false => so message should be Hide Text");
            setShowText(false);
        }
        else {
            console.log("Changing showText from false to true => so message should be Show Text");
            setShowText(true);
        }        
    };

    const it_showtext = props.configOptionsRef.current.interfaceText["_showtext_"];
    const it_hidetext = props.configOptionsRef.current.interfaceText["_hidetext_"];
              
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
	<p className="textmessage italic">{it_microphoneInstructions[lang_]}</p>
	    
	<p style={micLevelStyle}>Mic level: {micLevel}</p>

        <div style={{'minHeight': '300px'}}>        
          <div className="show-hide-block" style={showTextBlockStyle}>
            <div>
              <button id="show-hide-text"
                      onClick={handleShowHideToggle}
                >
                <div style={{verticalAlign: 'text-top'}}>{showText ? "▽ " + it_hidetext[lang_] : "▷ "+ it_showtext[lang_]}</div>
              </button>
            </div>
	    <div id="mic-markdown-message" className="textmessage" style={showTextMessageStyle}>	    
	      <Markdown>
		{text}
	      </Markdown>
	    </div>
          </div>
        </div>
        
      </div>
    );
    
    // Some alternative (smaller) potentially useful UTF glyphs for use above
    //   ▿ ▹
});

export { MicrophoneModeEnum, Microphone };
