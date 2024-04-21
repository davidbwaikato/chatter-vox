import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { calculateBarData, draw } from "../LiveAudioVisualizer/utils";

import { MediaPlayer } from "./MediaPlayer";

/*
// Inspired by MediaRecorder, MediaPlayer is a class that
// is used to to keep state of what is happening in terms
// of the playing audio

class MediaPlayer {
  public state: string;
  
  public constructor() {
      this.state = "inactive";
      //this.state = "initializing";
  }

  public setState(state: string) {
      othis.state = state;
  }
}
*/

export interface Props {
  /**
   * Media recorder who's stream needs to visualized
   */
  mediaPlayer: MediaPlayer;
  blob: Blob;
    
  /**
   * Width of the visualization. Default" "100%"
   */
  width?: number | string;
  /**
   * Height of the visualization. Default" "100%"
   */
  height?: number | string;
  /**
   * Width of each individual bar in the visualization. Default: `2`
   */
  barWidth?: number;
  /**
   * Gap between each bar in the visualization. Default `1`
   */
  gap?: number;
  /**
   * BackgroundColor for the visualization: Default `transparent`
   */
  backgroundColor?: string;
  /**
   *  Color of the bars drawn in the visualization. Default: `"rgb(160, 198, 255)"`
   */
  barColor?: string;
  /**
   * An unsigned integer, representing the window size of the FFT, given in number of samples.
   * A higher value will result in more details in the frequency domain but fewer details in the amplitude domain.
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize MDN AnalyserNode: fftSize property}
   * Default: `1024`
   */
  fftSize?:
    | 32
    | 64
    | 128
    | 256
    | 512
    | 1024
    | 2048
    | 4096
    | 8192
    | 16384
    | 32768;
  /**
   * A double, representing the maximum decibel value for scaling the FFT analysis data
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/maxDecibels MDN AnalyserNode: maxDecibels property}
   * Default: `-10`
   */
  maxDecibels?: number;
  /**
   * A double, representing the minimum decibel value for scaling the FFT analysis data, where 0 dB is the loudest possible sound
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/minDecibels MDN AnalyserNode: minDecibels property}
   * Default: `-90`
   */
  minDecibels?: number;
  /**
   * A double within the range 0 to 1 (0 meaning no time averaging). The default value is 0.8.
   * If 0 is set, there is no averaging done, whereas a value of 1 means "overlap the previous and current buffer quite a lot while computing the value",
   * which essentially smooths the changes across
   * For more details {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant MDN AnalyserNode: smoothingTimeConstant property}
   * Default: `0.4`
   */
  smoothingTimeConstant?: number;
}

const AudioSpectrumVisualizer: (props: Props) => ReactElement = ({
  mediaPlayer,
  blob,
    
  width = "100%",
  height = "100%",
  barWidth = 2,
  gap = 1,
  backgroundColor = "transparent",
  barColor = "rgb(160, 198, 255)",
  fftSize = 1024,
  maxDecibels = -10,
  minDecibels = -90,
  smoothingTimeConstant = 0.4,
}: Props) => {
   const [context] = useState(() => new AudioContext());
  //const [context, setContext] = useState<AudioContext>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
      console.log(`useEffect() blob defined = ${blob ? 1 : 0}`);      
	
    if (!blob) return;

      /*
      console.log("mediaPlayer.state = " + mediaPlayer.state)
      if (mediaPlayer.state === "initializing") {
	  console.log("Initializing AudioSpectruVisualizer");
	  report();
	  mediaPlayer.state = "inactive";

	  return;
      }
      else {      
	  if (!context) {
	      setContext(new AudioContext());
	  }
      }
      */
      
    //console.log('blob:'); console.log(blob);
    const connectAsSourceSync = async (audioBlob) => {
	const arrayBuffer = await audioBlob.arrayBuffer();
	//console.log('arrayBuffer:'); console.log(arrayBuffer)

	const audioBuffer = await context.decodeAudioData(arrayBuffer);
	//console.log('audioBuffer:'); console.log(audioBuffer)
	//console.log('audioBuffer.getChannelData(0):'); console.log(audioBuffer.getChannelData(0))
	

	const analyserNode = context.createAnalyser();
	setAnalyser(analyserNode);
	analyserNode.fftSize = fftSize;
	analyserNode.minDecibels = minDecibels;
	analyserNode.maxDecibels = maxDecibels;
	analyserNode.smoothingTimeConstant = smoothingTimeConstant;

	analyserNode.connect(context.destination);
	
	const source = context.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(analyserNode);

	source.onended = function() {
	    console.log("Playing sound has ended");
            source.stop(0);
	}
	
	if (mediaPlayer.state === "inactive") {
	    //if (navigator.userActivation.isActive) {
		console.log("Starting source");
		source.start();
		mediaPlayer.state = "playing";
	    //}
	}
      	
    }

    connectAsSourceSync(blob);

      //  https://stackoverflow.com/questions/40363335/how-to-create-an-audiobuffer-from-a-blob
      /*
      const fileReader = new FileReader();

      // Set up file reader on loaded end event
      fileReader.onloadend = () => {

	  const arrayBuffer = fileReader.result as ArrayBuffer

	  // Convert array buffer into audio buffer
	  audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
    
	      // Do something with audioBuffer
	      console.log(audioBuffer)
    
	  })
      
      }

      //Load blob
      fileReader.readAsArrayBuffer(blob)
      */
      
      
  //}, [mediaRecorder.stream]);
  }, [blob]);

  useEffect(() => {
      console.log(`useEffect() analyser defined = ${analyser ? 1 : 0}, mediaPlayer.state = ${mediaPlayer.state}`);
    if (analyser && mediaPlayer.state === "playing") {
      report();
    }
  }, [analyser, mediaPlayer.state]);

  const report = useCallback(() => {
      //console.log(`**** report() -- analyser = ${analyser ? 1 : 0}`);
    if (!analyser) return;

    const data = new Uint8Array(analyser?.frequencyBinCount);
    //console.log(` data.length = ${data.length}`);
    //console.log(` data.slice(0,100) = ${data.slice(0,100)}`);

    if (mediaPlayer.state === "initializing") {
      processFrequencyData(data);	  
    } else if (mediaPlayer.state === "playing") {
      analyser?.getByteFrequencyData(data);
      processFrequencyData(data);
      requestAnimationFrame(report);
    } else if (mediaPlayer.state === "paused") {
      processFrequencyData(data);
    } else if (mediaPlayer.state === "inactive" && context.state !== "closed") {
      context.close();
    }
  }, [analyser, context ? context.state : null]);

  const processFrequencyData = (data: Uint8Array): void => {
    if (!canvasRef.current) return;

    const dataPoints = calculateBarData(
      data,
      canvasRef.current.width,
      barWidth,
      gap
    );
    draw(
      dataPoints,
      canvasRef.current,
      barWidth,
      gap,
      backgroundColor,
      barColor
    );
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
          aspectRatio: "unset"
      }}
    />
  );
};

export { AudioSpectrumVisualizer };
//export { MediaPlayer, AudioSpectrumVisualizer };
