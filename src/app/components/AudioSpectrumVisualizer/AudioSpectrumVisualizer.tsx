import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from "react";

import { calculateBarData, draw, drawGrid } from "../av-utils/utils";

// Inspired by MediaRecorder, MediaPlayer is a class that
// is used to to keep state of what is happening in terms
// of the playing audio


class MediaPlayer {
    public state: string;
    
    public constructor(onstopcallback) {
        //console.log("**** !! MediaPlayer constructor called, setting state to 'inactive'");
        this.state = "inactive";
        
        this.onstopplaying = onstopcallback;
    }
    
    public setState(state: string) {
        this.state = state;
    }    
}


export interface Props {
  /**
   * The follow elements drive the audio that needs to be visualized
   *   mediaPlayer:  Controls that state of the audio (inactive,playing,paused)
   *   blob:         When non-null, the mimeType encoded audio to be played
   *   audioContext: Used to create the FFT analyser 
   *                 Web browsers require this to be generated in response to a user-click, 
   *                 in the interface, which is why it is generated externally and passed in
   */

  mediaPlayer: MediaPlayer;
  blob: Blob;
  audioContext: AudioContext;
    
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

  updateStatusCallback?: any;
}

// https://medium.com/@mattdeveloper/mastering-forwardref-in-react-with-typescript-c44857e7ff2fhttps://medium.com/@mattdeveloper/mastering-forwardref-in-react-with-typescript-c44857e7ff2f
//const AudioSpectrumVisualizer: (props: Props) => ReactElement = ({

const AudioSpectrumVisualizer = forwardRef<ReactElement, Props>(
	({	    
  mediaPlayer,
  blob,
  audioContext,  

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
  updateStatusCallback = null,  
}: Props, ref) => {
  const [analyser   , setAnalyser   ] = useState<AnalyserNode>();
  const [audioSource, setAudioSource] = useState<SourceNode>();

  const [duration , setDuration ] = useState<number>(0.0);
  const [startTime, setStartTime] = useState<number>(0.0);
  const [pauseTime, setPauseTime] = useState<number>(0.0);
  const [progress , setProgress ] = useState<number>(0.0);
    
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //const playingRef = useRef<bool>(false);

    useImperativeHandle(ref, () => ({
	updateVisualizerModeUNUSED(newState) {
	    console.log("**** !!!! updateVisualizerMode setting mediaPlayer.current.state = " + newState);
	    mediaPlayer.current.state = "processing";
	},
    }));
    
  const updateProgress = () => {
      const new_progress = startTime - audioContext.currentTime;
      setProgress(new_progress);
      //updateStatusCallback("[" + progress + " / " + duration + "]");
  };

  const resetProgress = () => {
      setDuration(0.0);
      setStartTime(0.0);
      setPauseTime(0.0)
      setProgress(0.0)
  };
    
  useEffect(() => {
      //console.log(`useEffect() [blob], blob defined = ${blob ? 1 : 0}, mediaPlayer.state = ${mediaPlayer.current ? mediaPlayer.current.state : null}`);      
      console.log("**** AudioSpectrumVisualizer.useEffect([blob])", blob);
      
      if (!blob) {
          console.log(`**** mediaPlayer.current = ${mediaPlayer.current}`);
          console.log(`**** audioContext.state = ${audioContext ? audioContext.state : null}`);
          if (audioSource) {
              audioSource.stop(0);
          }
          
          /*
          if (mediaPlayer.current && audioContext) {
              console.log(` audioContext.state = ${audioContext.state}`);
              if (mediaPlayer.current.state === "inactive" && audioContext.state === "running") {
                  audioSource.stop(0); // **** ????
                  //setAudioSource(null);
                  
                  //audioContext.close();
                  //setAnalyser(null);
                  //resetProgress();
                  
              }
          }
          */

          // Refactor into supporting function
          console.log("Displaying default frequency values of zeros");          
          const dataZeros = Array.from({ length: Math.floor(fftSize/2) }, () => ({
              max: 0,
              min: 0,
          }));
	  const data = new Uint8Array(dataZeros);	  
	  processFrequencyData(data);
          
	  return;
      }

      
      const connectAsSourceSync = async (audioBlob) => {
	console.log("Converting blob to AudioData and setting up Analyser");

        // On how to convert a blob to an audiobuffer, some responses to posted
        // articles expressed concern that Safari needs a file to decode
        // However -- if it was indeed an issue -- this looks to be a legacy
        // issue, as testing in Safari (28 May 2024) works correctly
        //
        // For an alternative way for creating a an audiobuffer from a blob see:
        //   https://stackoverflow.com/questions/40363335/how-to-create-an-audiobuffer-from-a-blob


	// Audio returned to Te Hihu not playing correctly ... truncates
	// Issue with how the MP3 is perhaps formed?
	
	// https://stackoverflow.com/questions/57237660/cannot-get-audio-blob-recorded-in-chrome-to-work-in-safari

	  /*
	const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      	    const fileReader = new FileReader();
	    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
	    fileReader.onerror = reject;
	    fileReader.readAsArrayBuffer(audioBlob);
	});
	  */
	  
	const arrayBuffer = await audioBlob.arrayBuffer();
	console.log("**** !!!! arrayBuffer = " + JSON.stringify(arrayBuffer));
	console.log(arrayBuffer)
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	console.log("**** !!!! audioBuffer = " + JSON.stringify(arrayBuffer));
	console.log(audioBuffer)
	

        // For details on duration, and current progress while playing:
        //   https://stackoverflow.com/questions/31644060/how-can-i-get-an-audiobuffersourcenodes-current-time
        setDuration(audioBuffer.duration); // in seconds
          
	const analyserNode = audioContext.createAnalyser();
	setAnalyser(analyserNode);
	analyserNode.fftSize = fftSize;
	analyserNode.minDecibels = minDecibels;
	analyserNode.maxDecibels = maxDecibels;
	analyserNode.smoothingTimeConstant = smoothingTimeConstant;

	analyserNode.connect(audioContext.destination);
	
	const audioSourceNode = audioContext.createBufferSource();
        setAudioSource(audioSourceNode);
	audioSourceNode.buffer = audioBuffer;
	audioSourceNode.connect(analyserNode);

	audioSourceNode.onended = function() {
	    console.log("Playing sound has ended");
            setAudioSource(null);
            
	    mediaPlayer.current.onstopplaying();
	};
	
	if (mediaPlayer.current.state === "playing") {              
	    console.log("Starting audio source");
	    audioSourceNode.start();
            setStartTime(audioContext.currentTime);
            updateProgress();
	}
      	
    };

      connectAsSourceSync(blob);
      
  }, [blob]);

  useEffect(() => {
      //console.log(`useEffect() [analyser, mediaPlayer.state]: analyser defined = ${analyser ? 1 : 0}, mediaPlayer.state = ${mediaPlayer.current ? mediaPlayer.current.state : null}`);

      // Keep a special eye out for being in the busy processing state
      if (mediaPlayer.current && mediaPlayer.current.state === "processing") {
	  console.log("Interface busy processing => calling report()");
	  report();
	  return;
      }
      
      if (!analyser) {
          console.log("[mediaPlayer.current.state has changed => Displaying default frequency values of zeros");
          const dataZeros = Array.from({ length: Math.floor(fftSize/2) }, () => ({
	      max: 0,
	      min: 0,
          }));
	  const data = new Uint8Array(dataZeros);	  
	  processFrequencyData(data);	  
          return;
      }
      
      if (analyser && mediaPlayer.current.state === "playing") {
          console.log("mediaPlayer.current.state and changed and is set to 'playing' => Calling report()");
          report();
      }
  }, [analyser, mediaPlayer.current ? mediaPlayer.current.state : null]);

  
  const report = useCallback((timestamp) => {
      //console.log(`**** report() -- analyser = ${analyser ? 1 : 0} audioContext.state = ${audioContext ? audioContext.state : null}`);

      // look out for displaying the 'busy' animated visual as a special case
      // => doesn't need a audioContext or mediaPlayer to operate
      if (mediaPlayer.current.state === "processing") {
          processBusyData(timestamp);
          //console.log("  processing, requestAnimationFrame");
          requestAnimationFrame(report);
	  return;
      }
      
      if (!analyser) {
          return;
      }

      if (audioContext.state === "closed") {
          return;
      }
      
    
      //console.log(`      -- checking mediaPlayer.state = ${mediaPlayer.current.state}`);
      if (mediaPlayer.current.state === "playing") {
	const data = new Uint8Array(analyser?.frequencyBinCount);
	  
        if (audioContext.state === "suspended") {
            // AudioContext coming out of pause-state
            // => Need to recalculate the startTime, to take account of pause,            
            //    so the progress calculation remains correct
            const pause_duration = audioContext.currenTime - pauseTime;
            const pause_compensated_start_time = startTime + pause_duration;
            setStartTime(pause_compensated_start_time);
            audioContext.resume();
        }

        analyser?.getByteFrequencyData(data);
        processFrequencyData(data);
        //console.log("  playing, requestAnimationFrame");
        requestAnimationFrame(report);
    }
    else if (mediaPlayer.current.state === "paused") {
        if (audioContext.state === "running") {
            // AudioContext entering pause-state
            setPauseTime(audioContext.currentTime);              
            audioContext.suspend();
        }
        requestAnimationFrame(report);                    
    }
    else if (mediaPlayer.current.state === "inactive") {
      //else if (mediaPlayer.current.state === "inactive") {
	  //audioContext.suspend();
          if (audioContext && audioContext.state === "suspended") {
            // This can happen if the user goes from paused to stop
            // In which case we want the audioContext out of the suspend state
              audioContext.resume();
          }
        
          if (audioSource) {
              audioSource.stop(0)
          }

        console.log("Changing from playing/processing to inactive");
	console.log("=> Displaying default frequency values of zeros");          
          const dataZeros = Array.from({ length: Math.floor(fftSize/2) }, () => ({
              max: 0,
              min: 0,
          }));
	  const data = new Uint8Array(dataZeros);	  
	  processFrequencyData(data);
	
      }
  }, [analyser, audioContext ? audioContext.state : null]);

  const processFrequencyData = (data: Uint8Array): void => {
      //console.log("*** processFrequencyData()");
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

    const processBusyData = (timestamp: number): void => {
	//console.log("*** processBusyData()");
	if (!canvasRef.current) return;
	
	drawGrid(
	    timestamp,
	    canvasRef.current,
	    barWidth,
	    gap,
	    backgroundColor,
	    barColor // used for boxColor
	);
	  
    };
 
    
  return (
      <canvas
        className="audio-spectrum-visualizer"
        ref={canvasRef}
        width={width}
        height={height}
        style={{
            aspectRatio: "unset"
        }}
      />
  );
});

export { MediaPlayer, AudioSpectrumVisualizer };
