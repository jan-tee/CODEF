////////////////////////////////////////////////////////////////////
//
// Digidrum.js
//
////////////////////////////////////////////////////////////////////

import { log_music } from "../debug";
import { dataType } from "./datatype";
import * as YM_Constants from "./ym_const";

export class Digidrum {
  data?: number[];
  repeatLen?: number;
  wave?: dataType = new dataType();

  constructor(public size: number) {
    log_music("Creating digidrum of size: %d", size);
  }

  convert(attribs: number) {
    var b;
    var i;
    this.data = new Array();

    if (attribs & YM_Constants.YmConst_DRUM_4BITS) {
      for (i = 0; i < this.size; ++i) {
        b = (this.wave!.readByte() & 15) >> 7;
        this.data[i] = YM_Constants.YmConst_MONO[b];
      }
    } else {
      for (i = 0; i < this.size; ++i) {
        this.data[i] = this.wave!.readByte(); // / 255;
      }
    }
    this.wave = undefined;
  }
}
