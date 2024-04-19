"use client";

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/components/IconMicrophone";

const Microphone = (props) => {
    const { recording, startRecording, stopRecording, micLevel, text, audioFilename } = useRecordVoice(props);

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
      <div className="flex flex-col justify-center items-center">
	    <p>{tm_how_to_record_[lang_]}</p>
        <button className="border-none bg-transparent w-10"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                onContextMenu={(e)=> e.preventDefault()} >
          <IconMicrophone micLevel={micLevel} />
        </button>
	<p style={micLevelStyle} >Mic level: {micLevel}</p>
	<p>{text}</p>

      </div>
  );
};

export { Microphone };
