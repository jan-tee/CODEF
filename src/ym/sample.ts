////////////////////////////////////////////////////////////////////
//
// Sample.js
//
////////////////////////////////////////////////////////////////////
import * as YM_Constants from "./ym_const";

export class Sample {
  voiceA = -1;
  voiceB = -1;
  voiceC = -1;

  constructor() {}

  mono() {
    var v = YM_Constants.YmConst_MONO;
    var vol = 0.0;

    if (this.voiceA > -1) vol += v[this.voiceA];
    if (this.voiceB > -1) vol += v[this.voiceB];
    if (this.voiceC > -1) vol += v[this.voiceC];
    return vol;
  }

  left() {
    var v = YM_Constants.YmConst_STEREO;
    var vol = 0.0;

    if (this.voiceA > -1) vol += v[this.voiceA];
    if (this.voiceB > -1) vol += v[this.voiceB];
    return vol;
  }

  right() {
    var v = YM_Constants.YmConst_STEREO;
    var vol = 0.0;

    if (this.voiceB > -1) vol += v[this.voiceB];
    if (this.voiceC > -1) vol += v[this.voiceC];
    return vol;
  }
}
