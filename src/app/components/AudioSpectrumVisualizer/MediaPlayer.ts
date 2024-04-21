
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

export { MediaPlayer }; 
