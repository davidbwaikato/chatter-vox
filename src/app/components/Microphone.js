"use client";

import { useRecordVoice } from "@/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/components/IconMicrophone";

const Microphone = () => {
    const { recording, startRecording, stopRecording, text, micLevel } = useRecordVoice();

    const micLevelStyle = {
        visibility: recording ? 'visible' : 'hidden'
    };
    
    return (
      <div className="flex flex-col justify-center items-center">
        <button
          className="border-none bg-transparent w-10"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onContextMenu={(e)=> e.preventDefault()}
        >
          <IconMicrophone micLevel={micLevel} />
        </button>
	<p style={micLevelStyle} >Mic level: {micLevel}</p>
	<p>Recognised text: {text}</p>

      </div>
  );
};

export { Microphone };
