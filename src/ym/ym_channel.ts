////////////////////////////////////////////////////////////////////
//
// YmChannel.js
//
////////////////////////////////////////////////////////////////////

import { Digidrum } from "./digidrum";
import { YmProcessor } from "./ym_processor";
import * as YM_Constants from "./ym_const";

export class YmChannel {
  mixNoise = 0;
  mixTone = 0;
  mode: boolean = false;
  position = 0;
  step = 0;
  digidrum: boolean = false;
  drum?: Digidrum;
  drumPos = 0;
  drumStep = 0;
  vol = 0;

  constructor(public processor: YmProcessor) {}

  enabled() {
    return (this.position >> 30) | this.mixTone;
  }

  getvolume() {
    return this.mode ? this.processor.volumeEnv : this.vol;
  }

  setvolume(value: number) {
    if (value & 16) {
      this.mode = true;
    } else {
      this.mode = false;
    }
    this.vol = value;
  }

  next() {
    this.position += this.step;
    if (this.position > 2147483647) this.position -= 2147483647;
  }

  computeTone(high: number, low: number) {
    var p = (high << 8) | low;

    if (p < 5) {
      this.position = 1073741824;
      this.step = 0;
    } else {
      p = this.processor.clock / ((p << 3) * this.processor.audioFreq);
      this.step = Math.floor(p * 1073741824);
    }
  }

  computeVolume() {
    var pos;

    if (this.digidrum) {
      pos = this.drumPos >> YM_Constants.YmConst_DRUM_PREC;
      this.vol = this.drum!.data![pos] / 16; //6;
      this.mixNoise = 65535;
      this.mixTone = 65535;

      this.drumPos += this.drumStep;
      pos = this.drumPos >> YM_Constants.YmConst_DRUM_PREC;
      if (pos >= this.drum!.size) {
        this.digidrum = false;
      }
    }
  }

  drumStart(drumFreq: number) {
    this.digidrum = true;
    this.drumPos = 0;
    this.drumStep = (drumFreq << 15) / this.processor.audioFreq;
  }

  drumStop() {
    this.digidrum = false;
  }
}
