////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// YM replay routine
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
//
// YmProcessor.js
//
////////////////////////////////////////////////////////////////////

import { music } from "../codef_music";
import { LHa } from "./lha";
import { Sample } from "./sample";
import { YmChannel } from "./ym_channel";
import { YmSong } from "./ym_song";
import * as YM_Constants from "./ym_const"

export class YmProcessor {
  sound: any;
  soundChannel: any;
  soundChannelPos: any;
  song: any;
  loop = 1;
  stereo: boolean = false;
  audioFreq: any;
  clock: any;
  registers = new Array();
  volumeEnv: any;

  buffer: any;
  bufferSize: any;

  samplesTick: any;
  samplesLeft: any;
  frame: any;

  envData: any;
  envPhase: any;
  envPos: any;
  envShape: any;
  envStep: any;

  noiseOutput: any;
  noisePos: any;
  noiseStep: any;
  rng: any;

  syncBuzzer: any;
  syncBuzzerPhase: any;
  syncBuzzerStep: any;

  voiceA: YmChannel;
  voiceB: YmChannel;
  voiceC: YmChannel;

  constructor() {
    this.voiceA = new YmChannel(this);
    this.voiceB = new YmChannel(this);
    this.voiceC = new YmChannel(this);
    this.init();
    this.reset();
    music.CODEF_AUDIO_NODE!.connect(music.CODEF_AUDIO_CONTEXT!.destination);
  }

  init() {
    var i;

    this.bufferSize = YM_Constants.YmConst_BUFFER_SIZE;
    this.buffer = new Array();

    for (i = 0; i < this.bufferSize; ++i) {
      this.buffer[i] = new Sample();
    }

    this.envData = YM_Constants.YmConst_ENVELOPES;
  }

  load(stream: any) {
    var monLHa = new LHa();
    this.song = new YmSong(monLHa.unpack(stream));

    this.audioFreq = YM_Constants.YmConst_PLAYER_FREQ;
    this.clock = this.song.clock;
    this.samplesTick = this.audioFreq / this.song.rate;

    music.CODEF_AUDIO_NODE!.onaudioprocess = (event) => {
      // @TODO might be wrong 'this'... or not
      this.mixer(event);
    };

    return this.song.supported;
  }

  mixer(e: any) {
    var b = 0;
    var i = 0;
    var mixed = 0;
    var mixPos = 0;
    var sample;
    var size = 0;
    var toMix = 0;
    var value = 0;

    while (mixed < this.bufferSize) {
      if (this.samplesLeft == 0) {
        if (this.frame >= this.song.length) {
          if (this.loop) {
            this.frame = this.song.restart;
          } else {
            this.stop();
            return;
          }
        }

        this.syncBuzzerStop();

        for (i = 0; i < this.song.frameSize; i++) {
          this.registers[i] = this.song.frames[this.frame][i].charCodeAt(0);
        }
        this.frame++;
        //this.registers = this.song.frames[this.frame++];
        this.updateEffects(1, 6, 14);
        this.updateEffects(3, 8, 15);

        this.writeRegisters();
        this.samplesLeft = this.samplesTick;
      }

      toMix = this.samplesLeft;
      if (mixed + toMix > this.bufferSize) toMix = this.bufferSize - mixed;
      size = mixPos + toMix;

      for (i = mixPos; i < size; ++i) {
        sample = this.buffer[i];

        if (this.noisePos & 65536) {
          b = (this.rng & 1) ^ ((this.rng >> 2) & 1);
          this.rng = (this.rng >> 1) | (b << 16);
          this.noiseOutput ^= b ? 0 : 65535;
          this.noisePos &= 65535;
        }

        this.volumeEnv =
          this.envData[
            Math.floor(
              (this.envShape << 6) + (this.envPhase << 5) + (this.envPos >> 26)
            )
          ];

        this.voiceA.computeVolume();
        this.voiceB.computeVolume();
        this.voiceC.computeVolume();

        b = this.voiceA.enabled() & (this.noiseOutput | this.voiceA.mixNoise);
        // @TODO probably this was just a dangling leftover from someone's debugging:
        // var toto = this.voiceA.getvolume();
        sample.voiceA = b ? this.voiceA.getvolume() : -1;
        b = this.voiceB.enabled() & (this.noiseOutput | this.voiceB.mixNoise);
        sample.voiceB = b ? this.voiceB.getvolume() : -1;
        b = this.voiceC.enabled() & (this.noiseOutput | this.voiceC.mixNoise);
        sample.voiceC = b ? this.voiceC.getvolume() : -1;

        this.voiceA.next();
        this.voiceB.next();
        this.voiceC.next();

        this.noisePos += this.noiseStep;
        this.envPos += this.envStep;
        if (this.envPos > 2147483647) this.envPos -= 2147483647;
        if (this.envPhase == 0 && this.envPos < this.envStep) {
          // @TODO added "this."
          this.envPhase = 1;
        }

        if (this.syncBuzzer) {
          this.syncBuzzerPhase += this.syncBuzzerStep;

          if (this.syncBuzzerPhase & 1073741824) {
            this.envPos = 0;
            this.envPhase = 0;
            this.syncBuzzerPhase &= 0x3fffffff;
          }
        }
      }

      mixed += toMix;
      mixPos = size;
      this.samplesLeft -= toMix;
    }

    var l = e.outputBuffer.getChannelData(0);
    var r = e.outputBuffer.getChannelData(1);

    if (this.stereo) {
      for (i = 0; i < this.bufferSize; ++i) {
        sample = this.buffer[i];
        l[i] = sample.left();
        r[i] = sample.right();
      }
    } else {
      for (i = 0; i < this.bufferSize; ++i) {
        value = this.buffer[i].mono();
        l[i] = value;
        r[i] = value;
      }
    }
  }

  writeRegisters() {
    var p;

    this.registers[0] &= 255;
    this.registers[1] &= 15;
    this.voiceA.computeTone(this.registers[1], this.registers[0]);

    this.registers[2] &= 255;
    this.registers[3] &= 15;
    this.voiceB.computeTone(this.registers[3], this.registers[2]);

    this.registers[4] &= 255;
    this.registers[5] &= 15;
    this.voiceC.computeTone(this.registers[5], this.registers[4]);

    this.registers[6] &= 31;

    if (this.registers[6] < 3) {
      this.noisePos = 0;
      this.noiseOutput = 65535;
      this.noiseStep = 0;
    } else {
      p = this.clock / ((this.registers[6] << 3) * this.audioFreq);
      this.noiseStep = Math.floor(p * 32768);
    }

    this.registers[7] &= 255;

    this.voiceA.mixTone = this.registers[7] & 1 ? 65535 : 0;
    this.voiceB.mixTone = this.registers[7] & 2 ? 65535 : 0;
    this.voiceC.mixTone = this.registers[7] & 4 ? 65535 : 0;

    this.voiceA.mixNoise = this.registers[7] & 8 ? 65535 : 0;
    this.voiceB.mixNoise = this.registers[7] & 16 ? 65535 : 0;
    this.voiceC.mixNoise = this.registers[7] & 32 ? 65535 : 0;

    this.registers[8] &= 31;
    this.voiceA.setvolume(this.registers[8]);
    this.registers[9] &= 31;
    this.voiceB.setvolume(this.registers[9]);
    this.registers[10] &= 31;
    this.voiceC.setvolume(this.registers[10]);

    this.registers[11] &= 255;
    this.registers[12] &= 255;
    p = (this.registers[12] << 8) | this.registers[11];

    if (p < 3) {
      this.envStep = 0;
    } else {
      p = this.clock / ((p << 8) * this.audioFreq);
      this.envStep = Math.floor(p * 1073741824);
    }

    if (this.registers[13] == 255) {
      this.registers[13] = 0;
    } else {
      this.registers[13] &= 15;
      this.envPhase = 0;
      this.envPos = 0;
      this.envShape = this.registers[13];
    }
  }

  updateEffects(code: number, preDiv: number, count: number) {
    var index = 0;
    var tmpFreq = 0;
    var voice = 0;

    code = this.registers[code] & 0xf0;
    preDiv = (this.registers[preDiv] >> 5) & 7;
    count = this.registers[count];

    if (code & 0x30) {
      voice = ((code & 0x30) >> 4) - 1;

      switch (code & 0xc0) {
        case 0x00:
        case 0x80:
          break;
        case 0x40:
          index = this.registers[voice + 8] & 31;

          if (index >= 0 && index < this.song.drums) {
            preDiv = YM_Constants.YmConst_MFP_PREDIV[preDiv] * count;
            if (preDiv > 0) {
              tmpFreq = 2457600 / preDiv;

              if (voice == 0) {
                this.voiceA.drum = this.song.digidrums[index];
                this.voiceA.drumStart(tmpFreq);
              } else if (voice == 1) {
                this.voiceB.drum = this.song.digidrums[index];
                this.voiceB.drumStart(tmpFreq);
              } else if (voice == 2) {
                this.voiceC.drum = this.song.digidrums[index];
                this.voiceC.drumStart(tmpFreq);
              }
            }
          }
          break;
        case 0xc0:
          break;
      }
    }
  }

  syncBuzzerStart(timerFreq: number, shapeEnv: number) {
    // @TODO lots of changes to "this. " - check original
    this.envShape = shapeEnv & 15;
    this.syncBuzzerStep = (timerFreq * 1073741824) / this.audioFreq;
    this.syncBuzzerPhase = 0;
    this.syncBuzzer = true;
  }

  syncBuzzerStop() {
    this.syncBuzzer = false;
    this.syncBuzzerPhase = 0;
    this.syncBuzzerStep = 0;
  }

  stop() {
    this.reset();
    return true;
  }

  reset() {
    var i;

    this.voiceA = new YmChannel(this);
    this.voiceB = new YmChannel(this);
    this.voiceC = new YmChannel(this);
    this.samplesLeft = 0;
    this.frame = 0;

    this.registers = new Array();
    for (i = 0; i < 16; ++i) this.registers[i] = 0;
    this.registers[7] = 255;

    this.writeRegisters();
    this.volumeEnv = 0;

    this.noiseOutput = 65535;
    this.noisePos = 0;
    this.noiseStep = 0;
    this.rng = 1;

    this.envPhase = 0;
    this.envPos = 0;
    this.envShape = 0;
    this.envStep = 0;

    this.syncBuzzerStop();
  }
}
