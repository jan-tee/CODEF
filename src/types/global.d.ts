export {};

declare global {
  interface Window {
    requestAnimFrame: any;
    // neoart audio player stuff
    neoart: {
      Unzip: any;
      audioContext: any;
      analyserNode: any;
      Flectrum: any;
      F2Player: any;
      MKPlayer: any;
      HMPlayer: any;
      PTPlayer: any;
      FXPlayer: any;
      D1Player: any;
      D2Player: any;
      BPPlayer: any;
      FCPlayer: any;
      DMPlayer: any;
      S2Player: any;
      FEPlayer: any;
      S1Player: any;
      JHPlayer: any;
      DWPlayer: any;
      RHPlayer: any;
      STPlayer: any;
      FileLoader: any;
    };
    webkitAudioContext: AudioContext;
    mozAudioContext: AudioContext;
    oAudioContext: AudioContext;
    msAudioContext: AudioContext;
  }
}
