////////////////////////////////////////////////////////////////////
//
// YmSong.js
//
////////////////////////////////////////////////////////////////////

import { dataType } from "./datatype";
import { Digidrum } from "./digidrum";
import * as YM_Constants from "./ym_const";

export class YmSong {
  title?: string;
  author?: string;
  comment?: string;
  attribs?: number;
  clock?: number;
  digidrums?: Digidrum[];
  drums?: number;
  frames = new Array();
  frameSize?: number;
  length?: number;
  rate?: number;
  restart?: number;
  supported = true;
  data = new dataType();

  constructor(public stream: string) {
    this.data.data = stream;
    this.init();
  }

  public init() {
    this.decode();
    if (this.attribs! & YM_Constants.YmConst_INTERLEAVED) this.deinterleave();

    for (let i = 0; i < this.length!; ++i) {
      this.frames[i] = this.data.readBytes(0, this.frameSize!);
    }
  }

  public decode() {
    // @TODO never used... probably leftover from some point
    // var digidrum;
    var i;
    var id = this.data.readMultiByte(4, "txt");

    switch (id) {
      case "YM2!":
      case "YM3!":
      case "YM3b":
        this.frameSize = 14;
        this.length = (this.data!.data!.length - 4) / this.frameSize;
        this.clock = YM_Constants.YmConst_ATARI_FREQ;
        this.rate = 50;
        this.restart = id != "YM3b" ? 0 : this.data.readByte();
        this.attribs =
          YM_Constants.YmConst_INTERLEAVED | YM_Constants.YmConst_TIME_CONTROL;
        break;

      case "YM4!":
        this.supported = false;
        break;

      case "YM5!":
      case "YM6!":
        id = this.data.readMultiByte(8, "txt");
        if (id != "LeOnArD!") {
          this.supported = false;
          return;
        }

        this.length = this.data.readInt();
        this.attribs = this.data.readInt();
        this.drums = this.data.readShort();
        this.clock = this.data.readInt();
        this.rate = this.data.readShort();
        this.restart = this.data.readInt();
        this.data.readShort();

        if (this.drums) {
          this.digidrums = new Array();

          for (i = 0; i < this.drums; ++i) {
            let digidrum = new Digidrum(this.data.readInt());

            if (digidrum.size != 0) {
              digidrum.wave!.data = this.data.readBytes(0, digidrum.size);
              digidrum.convert(this.attribs);
              this.digidrums[i] = digidrum;
            }
          }
          this.attribs &= ~YM_Constants.YmConst_DRUM_4BITS;
        }

        this.title = this.data.readString();
        this.author = this.data.readString();
        this.comment = this.data.readString();

        this.frameSize = 16;
        this.attribs =
          YM_Constants.YmConst_INTERLEAVED | YM_Constants.YmConst_TIME_CONTROL;
        break;

      case "MIX1":
      case "YMT1":
      case "YMT2":
      default:
        this.supported = false;
        break;
    }
  }

  public deinterleave() {
    var i;
    var j;
    var s = 0;

    var p = new Array();
    var r = new Array<string>();

    for (i = 0; i < this.frameSize!; ++i)
      p[i] = this.data.pos + this.length! * i;

    for (i = 0; i < this.length!; ++i) {
      for (j = 0; j < this.frameSize!; ++j)
        r[j + s] = this.data!.data![i + p[j]];
      s += this.frameSize!;
    }

    // this.data.data = "";
    this.data.data = r.join(""); // @TODO this is a WILD guess
    this.data.pos = 0;
    this.attribs! &= ~YM_Constants.YmConst_INTERLEAVED;
  }
}
