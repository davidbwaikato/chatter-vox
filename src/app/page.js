"use client"

import React, { useState, useEffect, useRef, useCallback  } from 'react';

import ReactLoading from 'react-loading';
 

import { interfaceTextResolver } from "@/utils/interfaceText";

import { MicrophoneModeEnum,  Microphone  } from "@/app/components/Microphone";
import { AudioPlayerModeEnum, AudioPlayer } from "@/app/components/AudioPlayer";

import { MediaPlayer, AudioSpectrumVisualizer } from "@/app/components/AudioSpectrumVisualizer";

import AbortController from "abort-controller";

const InterfaceModeEnum = Object.freeze({"inactive":1, "recording": 2, "processing":3, "playing":4, "paused":5 });

export default function Home()
{
    const isMounted = useRef(false); // Used to ensure useEffect(),[] inits withside effects are idempotent
    const [isLoading, setIsLoading] = useState(true);
    
    const [ConfigOptions, setConfigOptions] = useState(null);
    const [Lang,          setLang         ] = useState("");
    
    const [interfaceMode,   setInterfaceMode]   = useState(InterfaceModeEnum.inactive);
    const [microphoneMode,  setMicrophoneMode]  = useState(MicrophoneModeEnum.inactive);
    const [audioPlayerMode, setAudioPlayerMode] = useState(AudioPlayerModeEnum.inactive);

    const [howCanIHelpText, setHowCanIHelpText] = useState(""); 
    const [statusText, setStatusText]     = useState("");

    const [blob, setBlob]                 = useState(null); // <Blob>
    const [apBlob, setAudioPlayerBlob]    = useState(null); // <Blob> for AudioPlayer
    const [audioContext, setAudioContext] = useState(null); // <AudioContext>

    //const [messages, setMessages] = useState([
    //    { role: "system",    content: "You are a helpful assistant" },
    //    { role: "assistant", content: "How can I help you today?" }
    //]);
    const [messages, setMessages] = useState(null);

    const [mediaPlayerWidth,     setMediaPlayerWidth    ] = useState(400);
    const [mediaPlayerHeight,    setMediaPlayerHeight   ] = useState(132);
    const [audioControllerWidth, setAudioControllerWidth] = useState( 46);
    const [interfaceWidth,       setInterfaceWidth      ] = useState(mediaPlayerWidth+audioControllerWidth);
    
    let microphoneImperativeRef = null;
    let visualizerImperativeRefUNUSED = null;

    const configOptionsRef = useRef(null); 
    const messagesRef      = useRef(null);    
    const mediaPlayer      = useRef(null); // <MediaPlayer>

    const abortControllerRef = useRef(null);

    useEffect(() => {
	// This init makes use of a side-effect, so needs to be controlled so it is only called once
	// Some NodeJS-based development modes call init twice to stress-test idempotency	
	if (isMounted.current) {
	    //console.log("[page.js] Init useEffect(),[] with side-effect already called.  Skipping repeated call.");
	    return;
	}
	isMounted.current = true;

	console.log("[page.js] Init useEffect() loading Interface JSON Config with fetch() as side-effect");
	
	async function fetchConfigData() {
	    try {
		// Fetch the JSON file from the public directory
		const response = await fetch("/interface-config.json");
		if (!response.ok) {
		    throw new Error('Failed to load JSON file');
		}
		const data = await response.json();

		console.log("Fetch data returned");

		// Check to see if 'lang' in URL params
		const queryParams = new URLSearchParams(window.location.search);
		const lang_param = queryParams.get('lang'); 
		
		if (lang_param) {		    
		    if (lang_param != data.lang) {
			console.log("Changing display language based on URL param: " + lang_param);
			data.lang = lang_param;
		    }
		}

		// Check for any query params of the form params.XXX
		// => use to override value in data
		for (const full_param of queryParams.keys()) {		    
		    const match = full_param.match(/^params\.(\w+)$/);		    
		    if (match) {
			const param_name = match[1];
			const param_val  = queryParams.get(full_param);

			data.params[param_name] = param_val;
		    }
		}
		
		setConfigOptions(data);
		configOptionsRef.current = data;
				   
		console.log("ConfigOptios set: ", data);		
	    }
	    catch (error) {
		console.error("Error reading the JSON file:", error);
	    }
	    finally {
		// Stop loading once done
		console.log("Setting isLoading to false");
		setIsLoading(false);
	    }
	}

	// App Init
	// => Get the config settings up and running
	console.log("App Init => load config");
	console.log("  isLoading = " + isLoading);
	fetchConfigData();	
    }, []);

    useEffect(() => {
	// Further App inits
	console.log("[page.js] Init useEffect() if 'window' defined and 'mediaPlayer.current' != null");
	      
	if (typeof window !== 'undefined') {
	    //console.log("App init, dynamically setting MediaPlayer dimensions");
	    if (window.innerWidth < 600) {
		const width = 280;
		setMediaPlayerWidth(width);
		setInterfaceWidth(width+audioControllerWidth);
	    }
        } 
	
	if (mediaPlayer.current === null) {
	    
	    mediaPlayer.current = new MediaPlayer(function() {
		// callback function, when audio stops playing
		console.log("mediaPlayer.onstopplaying() callback called!");
		updateStatus("_statusWaiting_");
                setBlob(null);
		});	    
	}
	
	if (abortControllerRef.current == null) {
	    // StackOverflow posting on how to interrupt a fetch()    
	    //   https://stackoverflow.com/questions/31061838/how-do-i-cancel-an-http-fetch-request
	    
	    abortControllerRef.current = new AbortController();
	}
	
    }, []);

    useEffect(() => {
	console.log("[page.js] useEffect() [ConfigOptions] has changed: ");
	if (ConfigOptions != null) {
	    // **** XXXX
	    // For now, always assume lang has change
	    // if ((Lang == "") || (Lang != ConfigOptions.lang)) {
	    setLang(ConfigOptions.lang);
	    setHowCanIHelpText(interfaceTextResolver(ConfigOptions,"_howCanIHelp_",ConfigOptions.lang));
	    //}

	}
    }, [ConfigOptions]);

    useEffect(() => {
	console.log("[page.js] useEffect() [Lang] has changed: " + Lang);

	// **** XXXX
	//const NewConfigOptions = {...DefaultConfigOptions, "lang": Lang}
	//configOptionsRef.current = NewConfigOptions
	//setConfigOptions(NewConfigOptions);

	if (configOptionsRef.current) {
	    //console.log("**** setting configOptionsRef.current.lang = " + configOptionsRef.current.lang + ", Lang="+Lang);
	    
	    configOptionsRef.current.lang = Lang;	    
	    //updateStatus("_statusWaiting_");
	}
	
    }, [Lang]);
    

    useEffect(() => {
	if (blob !== null) {
	    console.log(`[page.js] useEffect() [blob] non-null blob => setting mediaPlayer.state to "playing"`);
            setInterfaceMode(InterfaceModeEnum.playing);
	    mediaPlayer.current.state = "playing";

            // Take a copy of the blob so the audio player can start/stop playing it
	    console.log(blob)
            setAudioPlayerBlob(blob);
	}
	else {
	    console.log(`[page.js] useEffect() [blob] blob is null  => setting mediaPlayer.state to "inactive"`);
            setInterfaceMode(InterfaceModeEnum.inactive);            
	    mediaPlayer.current.state = "inactive";
	}
    }, [blob]);

    
    useEffect(() => {
	if (isLoading) { return }
	
        if (interfaceMode === InterfaceModeEnum.inactive) {
            setMicrophoneMode(MicrophoneModeEnum.inactive);
	    microphoneImperativeRef.updateMicrophoneMode(MicrophoneModeEnum.inactive);
            setAudioPlayerMode(AudioPlayerModeEnum.inactive);
        }
        else if (interfaceMode === InterfaceModeEnum.recording) {
            setMicrophoneMode(MicrophoneModeEnum.recording);
            setAudioPlayerMode(AudioPlayerModeEnum.inactive);
        }            
        else if (interfaceMode === InterfaceModeEnum.processing) {
	    microphoneImperativeRef.updateMicrophoneMode(MicrophoneModeEnum.disabled);
	    mediaPlayer.current.state = "processing";
	    
        }            
        else if (interfaceMode === InterfaceModeEnum.playing) {
            setMicrophoneMode(MicrophoneModeEnum.disabled);
	    microphoneImperativeRef.updateMicrophoneMode(MicrophoneModeEnum.disabled);
            setAudioPlayerMode(AudioPlayerModeEnum.playing);
        }
        else if (interfaceMode === InterfaceModeEnum.paused) {
            setMicrophoneMode(MicrophoneModeEnum.disabled);
	    microphoneImperativeRef.updateMicrophoneMode(MicrophoneModeEnum.disabled);
            setAudioPlayerMode(AudioPlayerModeEnum.paused);
        }        
    }, [interfaceMode]);


    useEffect(() => {
	console.log("[page.js] App useEffect(), [messages] has changed: ", messages);
	messagesRef.current = messages;
    }, [messages]);

    const updateLang = (new_lang) => {
	const newConfigOptions = {...ConfigOptions, lang: new_lang};
	setConfigOptions(newConfigOptions);
	configOptionsRef.current = newConfigOptions;
    };
	
    const updateStatus = (text_marker) => {
	// This function needs to work with the configOptionsRef version of language
	// This is because calling the method sometimes occurs in from a callback function
	// and when the closure of the callback function is created, the Lang state is
	// as it is then is 'baked' in (i.e. is an older/stale version of the state).
	
	const Lang_ref = configOptionsRef.current.lang;
	
	console.log("*** updateStatus(), (dynamic look) Lang_ref = " + Lang_ref + ", text_marker = " + text_marker);	
	let lang_text = text_marker;
	
	if (text_marker in configOptionsRef.current.interfaceText) {

	    if (text_marker.endsWith("Processing_")) {
		setInterfaceMode(InterfaceModeEnum.processing);
	    }
	    else if (text_marker.match(/(Completed_|Recieved_|Result_)$/)) {
		setInterfaceMode(InterfaceModeEnum.inactive);		
	    }

	    lang_text = interfaceTextResolver(configOptionsRef.current,text_marker,Lang_ref);	    
	}

	const status_label = interfaceTextResolver(configOptionsRef.current,"_statusLabel_",Lang_ref);

	if (Lang_ref == "mi") {
	    // Te Taka requested that there be no 'status: ' text
	    setStatusText(lang_text);
	}
	else {
	    setStatusText(status_label+ ": " + lang_text);
	}

    };

    const handleAudioPauseToggle = () => {
        console.log("handleAudioPauseToggle()");
        if (mediaPlayer.current.state === "playing") {
            mediaPlayer.current.state = "paused";
	    updateStatus("_statusAudioPlayerPaused_");
        }
        else {
            mediaPlayer.current.state = "playing";
	    updateStatus("_statusAudioPlayerPlaying_");
        }
    };

    const handleAudioPlay = () => {
        console.log("handleAudioPlay()");
        if (mediaPlayer.current.state !== "playing") {
            mediaPlayer.current.state = "playing";
	    updateStatus("_statusAudioPlayerPlaying_");
            
	    console.log("Initializing a new AudioContext");
	    setAudioContext(new AudioContext());
            setBlob(apBlob);
        }
    };

    const handleAudioStop = () => {
        console.log("handleAudioStop()");
        if ((mediaPlayer.current.state === "playing") || (mediaPlayer.current.state === "paused")) {
            mediaPlayer.current.state = "inactive";
	    updateStatus("_statusAudioPlayerStopped_");
            
	    setBlob(null);
        }
	else if (mediaPlayer.current.state === "processing") {
	    abortControllerRef.current.abort("User interrupted processing");
            mediaPlayer.current.state = "inactive";
            setInterfaceMode(InterfaceModeEnum.inactive);	        
	    updateStatus("_statusWaiting_");
	    
	}
    };

   
    const audioFilenameCallbackDeprecated = (callbackAudioFilename, callbackBlob, callbackMimeType) => {
	console.log("[page.js] callbackAudioFilename = " + callbackAudioFilename)
	
	const callbackAudioURL = callbackAudioFilename.replace(/public/, "");
	
	setAudioFilename(callbackAudioFilename);

        if (audioContext === null) {
            console.log("Initializing AudioContext");
            setAudioContext(new AudioContext());
        }
	setBlob(callbackBlob);
    };


    const playAudioBlobCallback = (callbackBlob) => {
	console.log("[page.js] playAudioBlobCallback()");
	
        if (audioContext === null) {
            console.log("Initializing AudioContext");
            setAudioContext(new AudioContext());
        }
	setBlob(callbackBlob);
    };

    /*
    const updateMessagesCallback = (returnedMessagePair) => {
        console.log("returnedMessagePair = " + JSON.stringify(returnedMessagePair));
        const userMessage        = returnedMessagePair.userMessage;
        const returnedTopMessage = returnedMessagePair.returnedTopMessage;

        const updatedMessages = [...messages, userMessage, returnedTopMessage];
        setMessages(updatedMessages);	        
    };
*/
    const updateMessagesCallback = (updatedMessages,returnedMessagePair) => {
	// For backwards compatability reasons with debugging output
        console.log("**** returnedMessagePair = " + JSON.stringify(returnedMessagePair));

        setMessages([...updatedMessages]); // **** is the array copy needed here?
    };

    
    if (isLoading) {
	//console.log("Returning isLoading message");
	//return <p>Loading interface configuration settings ...</p>;

	return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px", backgroundColor: 'white'}}>
	        <div className="flex flex-col justify-center items-center">
		  <ReactLoading type="spinningBubbles" color="lightblue" height={'10%'} width={'10%'} />
		{/*Loading ...*/}
		</div>
	      </div>
	    </main>
	);
    }
    
    return (
	    <main className="flex min-h-screen flex-col items-center justify-center">
	      <div style={{width: "90%", maxWidth: "900px", backgroundColor: 'white'}}>

	        <div className="flex flex-col justify-center items-center">
	          <div className="textmessage pb-2" style={{width: interfaceWidth+'px'}} >                  
	            {howCanIHelpText}
	          </div>	    	    

                  <div style={{backgroundColor: '#f4f4f4', padding: '0.5rem 0.5rem 0 0.5rem'}}>
                    <div style={{width: audioControllerWidth+'px', float: 'left'}} >
                      <div style={{margin: '0.2rem'}}>
	                <AudioPlayer
                          mediaPlayer={mediaPlayer}
	                  autoAudioPlayerMode={audioPlayerMode}
	                  handlePauseToggle={handleAudioPauseToggle}
	                  handlePlay={handleAudioPlay}
	                  handleStop={handleAudioStop}
        		  updateStatusCallback={updateStatus}
                        />
                      </div>
                    </div>
	            <div className="border border-solid"
	                 style={{width: mediaPlayerWidth+'px', height: mediaPlayerHeight+'px',
                                 backgroundColor: 'white', borderColorXX: 'black', float: 'right'}}>
	              <AudioSpectrumVisualizer
	                ref={(ref) => (visualizerImperativeRefUNUSED = ref)}  
		        mediaPlayer={mediaPlayer}
	                blob={blob}
	                audioContext={audioContext}
                        fftSize={256}
		        width={mediaPlayerWidth}
		        height={mediaPlayerHeight}
		        barWidth={3}
		        gap={2}
		        barColor={'lightblue'}
        		updateStatusCallback={updateStatus}                        
		      />
	            </div>
                    
                  </div>
                  <div style={{backgroundColor: '#f4f4f4', padding: '0 0.5rem 0 0.5rem'}}>
	            <div className="textmessage text-sm p-2 mt-0 italic"
                         style={{width: interfaceWidth+'px', color: 'black', borderColorXX: '#176593'}} >
	              {statusText}
	            </div>
	          </div>
	          <Microphone
	            lang={Lang}
		    ref={(ref) => (microphoneImperativeRef = ref)}  
	            configOptionsRef={configOptionsRef}
                    messagesRef={messagesRef}
	            abortControllerRef={abortControllerRef}
		    updateLangCallback={updateLang}
		    updateStatusCallback={updateStatus}
	            playAudioBlobCallback={playAudioBlobCallback}
                    updateMessagesCallback={updateMessagesCallback}
	          />
                </div>
	      </div>
	    </main>
  );

}


