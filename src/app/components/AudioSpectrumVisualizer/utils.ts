
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
