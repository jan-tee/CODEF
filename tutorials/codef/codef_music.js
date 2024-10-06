/*------------------------------------------------------------------------------
Copyright (c) 2011 Antoine Santo Aka NoNameNo

This File is part of the CODEF project.

More info : http://codef.santo.fr
Demo gallery http://www.wab.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
------------------------------------------------------------------------------*/
function music(e) {
  window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext ||
    window.msAudioContext;
  if (typeof AudioContext != "undefined") {
    switch (e) {
      case "YM":
        CODEF_AUDIO_CONTEXT = new AudioContext();
        CODEF_AUDIO_NODE = CODEF_AUDIO_CONTEXT.createScriptProcessor(8192);
        this.loader = new Object();
        this.loader["player"] = new YmProcessor();
        this.stereo_value = false;
        break;
      default:
        this.stereo_value = false;
        break;
    }
  }
  if (e == "YM") {
    this.LoadAndRun = function (e) {
      var t = this;
      if (typeof AudioContext != "undefined") {
        var n = new XMLHttpRequest();
        n.open("GET", e);
        n.overrideMimeType("text/plain; charset=x-user-defined");
        n.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            var e = this.responseText || "";
            var n = [];
            var r = e.length;
            var i = String.fromCharCode;
            for (var s = 0; s < r; s++) {
              n[s] = i(e.charCodeAt(s) & 255);
            }
            var o = new dataType();
            o.data = n.join("");
            YmConst_PLAYER_FREQ = CODEF_AUDIO_CONTEXT.sampleRate;
            t.loader.player.stereo = t.stereo_value;
            t.loader.player.load(o);
          }
        };
        n.send();
      }
    };
  } else {
    this.LoadAndRun = function (e) {
      var t = this;
      this.loader = window.neoart.FileLoader;
      if (typeof AudioContext != "undefined") {
        var n = new XMLHttpRequest();
        n.open("GET", e);
        n.overrideMimeType("text/plain; charset=x-user-defined");
        n.responseType = "arraybuffer";
        n.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            t.loader.player = null;
            t.loader.load(this.response);
            t.loader.player.reset();
            t.loader.player.stereo = t.stereo_value;
            t.loader.player.play();
          }
        };
        n.send();
      }
    };
  }
  this.stereo = function (e) {
    this.stereo_value = e;
  };
  return this;
}
function YmSong(e) {
  this.title;
  this.author;
  this.comment;
  this.attribs;
  this.clock;
  this.digidrums;
  this.drums;
  this.frames = new Array();
  this.frameSize;
  this.length;
  this.rate;
  this.restart;
  this.supported = true;
  this.data = new dataType();
  this.data.data = e;
  this.init = function () {
    this.decode();
    if (this.attribs & YmConst_INTERLEAVED) this.deinterleave();
    for (i = 0; i < this.length; ++i) {
      this.frames[i] = this.data.readBytes(0, this.frameSize);
    }
  };
  this.decode = function () {
    var e;
    var t;
    var n = this.data.readMultiByte(4, "txt");
    switch (n) {
      case "YM2!":
      case "YM3!":
      case "YM3b":
        this.frameSize = 14;
        this.length = (this.data.data.length - 4) / this.frameSize;
        this.clock = YmConst_ATARI_FREQ;
        this.rate = 50;
        this.restart = n != "YM3b" ? 0 : this.data.readByte();
        this.attribs = YmConst_INTERLEAVED | YmConst_TIME_CONTROL;
        break;
      case "YM4!":
        this.supported = false;
        break;
      case "YM5!":
      case "YM6!":
        n = this.data.readMultiByte(8, "txt");
        if (n != "LeOnArD!") {
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
          for (t = 0; t < this.drums; ++t) {
            this.digidrum = new Digidrum(this.data.readInt());
            if (this.digidrum.size != 0) {
              this.digidrum.wave.data = this.data.readBytes(
                0,
                this.digidrum.size
              );
              this.digidrum.convert(this.attribs);
              this.digidrums[t] = this.digidrum;
            }
          }
          this.attribs &= ~YmConst_DRUM_4BITS;
        }
        this.title = this.data.readString();
        this.author = this.data.readString();
        this.comment = this.data.readString();
        this.frameSize = 16;
        this.attribs = YmConst_INTERLEAVED | YmConst_TIME_CONTROL;
        break;
      case "MIX1":
        supported = false;
        break;
      case "YMT1":
      case "YMT2":
        supported = false;
        break;
      default:
        supported = false;
        break;
    }
  };
  this.deinterleave = function () {
    var e;
    var t;
    var n = 0;
    var r = new Array();
    var i = new Array();
    for (e = 0; e < this.frameSize; ++e) r[e] = this.data.pos + this.length * e;
    for (e = 0; e < this.length; ++e) {
      for (t = 0; t < this.frameSize; ++t) i[t + n] = this.data.data[e + r[t]];
      n += this.frameSize;
    }
    this.data.data = "";
    this.data.data = i;
    this.data.pos = 0;
    this.attribs &= ~YmConst_INTERLEAVED;
  };
  this.init();
}
function YmProcessor() {
  this.counter;
  this.sound;
  this.soundChannel;
  this.soundChannelPos;
  this.song;
  this.loop = 1;
  this.stereo = 0;
  this.audioFreq;
  this.clock;
  this.registers = new Array();
  this.volumeEnv;
  this.buffer;
  this.bufferSize;
  this.voiceA = new YmChannel(this);
  this.voiceB = new YmChannel(this);
  this.voiceC = new YmChannel(this);
  this.samplesTick;
  this.samplesLeft;
  this.frame;
  this.envData;
  this.envPhase;
  this.envPos;
  this.envShape;
  this.envStep;
  this.noiseOutput;
  this.noisePos;
  this.noiseStep;
  this.rng;
  this.syncBuzzer;
  this.syncBuzzerPhase;
  this.syncBuzzerStep;
  __self = this;
  this.init = function () {
    var e;
    this.bufferSize = YmConst_BUFFER_SIZE;
    this.buffer = new Array();
    for (e = 0; e < this.bufferSize; ++e) this.buffer[e] = new Sample();
    this.envData = YmConst_ENVELOPES;
  };
  this.load = function (e) {
    var t = new LHa();
    this.song = new YmSong(t.unpack(e));
    this.audioFreq = YmConst_PLAYER_FREQ;
    this.clock = this.song.clock;
    this.samplesTick = this.audioFreq / this.song.rate;
    CODEF_AUDIO_NODE.onaudioprocess = function (e) {
      __self.mixer(e);
    };
    return this.song.supported;
  };
  this.mixer = function (e) {
    var t = 0;
    var n = 0;
    var r = 0;
    var i = 0;
    var s;
    var o = 0;
    var u = 0;
    var a = 0;
    while (r < this.bufferSize) {
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
        for (n = 0; n < this.song.frameSize; n++) {
          this.registers[n] = this.song.frames[this.frame][n].charCodeAt(0);
        }
        this.frame++;
        this.updateEffects(1, 6, 14);
        this.updateEffects(3, 8, 15);
        this.writeRegisters();
        this.samplesLeft = this.samplesTick;
      }
      u = this.samplesLeft;
      if (r + u > this.bufferSize) u = this.bufferSize - r;
      o = i + u;
      for (n = i; n < o; ++n) {
        s = this.buffer[n];
        if (this.noisePos & 65536) {
          t = (this.rng & 1) ^ ((this.rng >> 2) & 1);
          this.rng = (this.rng >> 1) | (t << 16);
          this.noiseOutput ^= t ? 0 : 65535;
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
        t = this.voiceA.enabled() & (this.noiseOutput | this.voiceA.mixNoise);
        var f = this.voiceA.getvolume();
        s.voiceA = t ? this.voiceA.getvolume() : -1;
        t = this.voiceB.enabled() & (this.noiseOutput | this.voiceB.mixNoise);
        s.voiceB = t ? this.voiceB.getvolume() : -1;
        t = this.voiceC.enabled() & (this.noiseOutput | this.voiceC.mixNoise);
        s.voiceC = t ? this.voiceC.getvolume() : -1;
        this.voiceA.next();
        this.voiceB.next();
        this.voiceC.next();
        this.noisePos += this.noiseStep;
        this.envPos += this.envStep;
        if (this.envPos > 2147483647) this.envPos -= 2147483647;
        if (this.envPhase == 0 && this.envPos < this.envStep) envPhase = 1;
        if (this.syncBuzzer) {
          this.syncBuzzerPhase += this.syncBuzzerStep;
          if (this.syncBuzzerPhase & 1073741824) {
            this.envPos = 0;
            this.envPhase = 0;
            this.syncBuzzerPhase &= 1073741823;
          }
        }
      }
      r += u;
      i = o;
      this.samplesLeft -= u;
    }
    var l = e.outputBuffer.getChannelData(0);
    var c = e.outputBuffer.getChannelData(1);
    if (this.stereo) {
      for (n = 0; n < this.bufferSize; ++n) {
        s = this.buffer[n];
        l[n] = s.left();
        c[n] = s.right();
      }
    } else {
      for (n = 0; n < this.bufferSize; ++n) {
        a = this.buffer[n].mono();
        l[n] = a;
        c[n] = a;
      }
    }
  };
  this.writeRegisters = function () {
    var e;
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
      e = this.clock / ((this.registers[6] << 3) * this.audioFreq);
      this.noiseStep = Math.floor(e * 32768);
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
    e = (this.registers[12] << 8) | this.registers[11];
    if (e < 3) {
      this.envStep = 0;
    } else {
      e = this.clock / ((e << 8) * this.audioFreq);
      this.envStep = Math.floor(e * 1073741824);
    }
    if (this.registers[13] == 255) {
      this.registers[13] = 0;
    } else {
      this.registers[13] &= 15;
      this.envPhase = 0;
      this.envPos = 0;
      this.envShape = this.registers[13];
    }
  };
  this.updateEffects = function (e, t, n) {
    var r = 0;
    var i = 0;
    var s = 0;
    e = this.registers[e] & 240;
    t = (this.registers[t] >> 5) & 7;
    n = this.registers[n];
    if (e & 48) {
      s = ((e & 48) >> 4) - 1;
      switch (e & 192) {
        case 0:
        case 128:
          break;
        case 64:
          r = this.registers[s + 8] & 31;
          if (r >= 0 && r < this.song.drums) {
            t = YmConst_MFP_PREDIV[t] * n;
            if (t > 0) {
              i = 2457600 / t;
              if (s == 0) {
                this.voiceA.drum = this.song.digidrums[r];
                this.voiceA.drumStart(i);
              } else if (s == 1) {
                this.voiceB.drum = this.song.digidrums[r];
                this.voiceB.drumStart(i);
              } else if (s == 2) {
                this.voiceC.drum = this.song.digidrums[r];
                this.voiceC.drumStart(i);
              }
            }
          }
          break;
        case 192:
          break;
      }
    }
  };
  this.syncBuzzerStart = function (e, t) {
    this.envShape = this.shapeEnv & 15;
    this.syncBuzzerStep = (this.timerFreq * 1073741824) / this.audioFreq;
    this.syncBuzzerPhase = 0;
    this.syncBuzzer = true;
  };
  this.syncBuzzerStop = function () {
    this.syncBuzzer = false;
    this.syncBuzzerPhase = 0;
    this.syncBuzzerStep = 0;
  };
  this.stop = function () {
    this.reset();
    return true;
  };
  this.reset = function () {
    var e;
    this.voiceA = new YmChannel(this);
    this.voiceB = new YmChannel(this);
    this.voiceC = new YmChannel(this);
    this.samplesLeft = 0;
    this.frame = 0;
    this.registers = new Array();
    for (e = 0; e < 16; ++e) this.registers[e] = 0;
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
  };
  this.init();
  this.reset();
  CODEF_AUDIO_NODE.connect(CODEF_AUDIO_CONTEXT.destination);
}
function Sample() {
  this.voiceA = -1;
  this.voiceB = -1;
  this.voiceC = -1;
  this.mono = function () {
    var e = YmConst_MONO;
    var t = 0;
    if (this.voiceA > -1) t += e[this.voiceA];
    if (this.voiceB > -1) t += e[this.voiceB];
    if (this.voiceC > -1) t += e[this.voiceC];
    return t;
  };
  this.left = function () {
    var e = YmConst_STEREO;
    var t = 0;
    if (this.voiceA > -1) t += e[this.voiceA];
    if (this.voiceB > -1) t += e[this.voiceB];
    return t;
  };
  this.right = function () {
    var e = YmConst_STEREO;
    var t = 0;
    if (this.voiceB > -1) t += e[this.voiceB];
    if (this.voiceC > -1) t += e[this.voiceC];
    return t;
  };
}
function YmChannel(e) {
  this.mixNoise = 0;
  this.mixTone = 0;
  this.mode = 0;
  this.position = 0;
  this.step = 0;
  this.digidrum = 0;
  this.drum = 0;
  this.drumPos = 0;
  this.drumStep = 0;
  this.processor = e;
  this.vol = 0;
  this.enabled = function () {
    return (this.position >> 30) | this.mixTone;
  };
  this.getvolume = function () {
    return this.mode ? this.processor.volumeEnv : this.vol;
  };
  this.setvolume = function (e) {
    if (e & 16) this.mode = true;
    else this.mode = false;
    this.vol = e;
  };
  this.next = function () {
    this.position += this.step;
    if (this.position > 2147483647) this.position -= 2147483647;
  };
  this.computeTone = function (e, t) {
    var n = (e << 8) | t;
    if (n < 5) {
      this.position = 1073741824;
      this.step = 0;
    } else {
      n = this.processor.clock / ((n << 3) * this.processor.audioFreq);
      this.step = Math.floor(n * 1073741824);
    }
  };
  this.computeVolume = function () {
    var e;
    if (this.digidrum) {
      e = this.drumPos >> YmConst_DRUM_PREC;
      this.vol = this.drum.data[e] / 16;
      this.mixNoise = 65535;
      this.mixTone = 65535;
      this.drumPos += this.drumStep;
      e = this.drumPos >> YmConst_DRUM_PREC;
      if (e >= this.drum.size) this.digidrum = false;
    }
  };
  this.drumStart = function (e) {
    this.digidrum = true;
    this.drumPos = 0;
    this.drumStep = (this.drumFreq << 15) / this.processor.audioFreq;
  };
  this.drumStop = function () {
    this.digidrum = false;
  };
}
function Digidrum(e) {
  this.data;
  this.repeatLen;
  this.size;
  this.wave = null;
  this.size = e;
  this.wave = new dataType();
  this.convert = function (e) {
    var t;
    var n;
    this.data = new Array();
    if (e & YmConst_DRUM_4BITS) {
      for (n = 0; n < this.size; ++n) {
        t = (this.wave.readByte() & 15) >> 7;
        this.data[n] = YmConst_MONO[t];
      }
    } else {
      for (n = 0; n < this.size; ++n) {
        this.data[n] = this.wave.readByte();
      }
    }
    this.wave = null;
  };
}
function dataType() {
  this.data;
  this.pos = 0;
  this.endian = "BIG";
  this.readBytes = function (e, t) {
    var n = "";
    for (var r = 0; r < t; r++) {
      n += this.data[e + this.pos++];
    }
    return n;
  };
  this.readMultiByte = function (e, t) {
    if (t == "txt") {
      var n = "";
      for (var r = 0; r < e; r++) {
        n += this.data[this.pos++];
      }
      return n;
    }
  };
  this.readInt = function () {
    var e = parseInt(this.data[this.pos + 0].charCodeAt(0).toString(16), 16);
    var t = parseInt(this.data[this.pos + 1].charCodeAt(0).toString(16), 16);
    var n = parseInt(this.data[this.pos + 2].charCodeAt(0).toString(16), 16);
    var r = parseInt(this.data[this.pos + 3].charCodeAt(0).toString(16), 16);
    if (this.endian == "BIG") var i = (e << 24) | (t << 16) | (n << 8) | r;
    else var i = (r << 24) | (n << 16) | (t << 8) | e;
    this.pos += 4;
    return i;
  };
  this.readShort = function () {
    var e = parseInt(this.data[this.pos + 0].charCodeAt(0).toString(16), 16);
    var t = parseInt(this.data[this.pos + 1].charCodeAt(0).toString(16), 16);
    var n = (e << 8) | t;
    this.pos += 2;
    return n;
  };
  this.readByte = function () {
    var e = parseInt(this.data[this.pos].charCodeAt(0).toString(16), 16);
    this.pos += 1;
    return e;
  };
  this.readString = function () {
    var e = "";
    while (1) {
      if (this.data[this.pos++].charCodeAt(0) != 0)
        e += this.data[this.pos - 1];
      else return e;
    }
  };
  this.substr = function (e, t) {
    return this.data.substr(e, t);
  };
  this.bytesAvailable = function () {
    return this.length - this.pos;
  };
}
function LHa() {
  this.data;
  this.source;
  this.buffer;
  this.output;
  this.srcSize;
  this.dstSize;
  this.srcPos;
  this.dstPos;
  this.c_Table;
  this.p_Table;
  this.c_Len;
  this.p_Len;
  this.l_Tree;
  this.r_Tree;
  this.bitBuffer;
  this.bitCount;
  this.subBuffer;
  this.blockSize;
  this.fillBufferSize;
  this.fillIndex;
  this.decodei;
  this.decodej;
  this.data = "";
  this.buffer = new Array();
  this.output = new Array();
  this.c_Table = new Array();
  this.p_Table = new Array();
  this.c_Len = new Array();
  this.p_Len = new Array();
  this.l_Tree = new Array();
  this.r_Tree = new Array();
  this.unpack = function (e) {
    this.header = new LHaHeader(e);
    if (
      this.header.size == 0 ||
      this.header.method != "-lh5-" ||
      this.header.level != 0
    )
      return e.data;
    this.source = e;
    this.srcSize = this.header.packed;
    this.srcPos = this.source.pos;
    this.dstSize = this.header.original;
    this.fillBufferSize = 0;
    this.bitBuffer = 0;
    this.bitCount = 0;
    this.subBuffer = 0;
    this.fillBuffer(16);
    this.blockSize = 0;
    this.decodej = 0;
    var t = this.dstSize;
    var n;
    var r;
    while (t != 0) {
      n = t > 8192 ? 8192 : t;
      this.decode(n);
      r = n > this.dstSize ? this.dstSize : n;
      if (r > 0) {
        this.output.pos = 0;
        for (var i = 0; i < r; i++) {
          this.data += String.fromCharCode(this.output[i]);
        }
        this.dstPos += r;
        this.dstSize -= r;
      }
      t -= n;
    }
    this.buffer = "";
    this.output = new Array();
    return this.data;
  };
  this.decode = function (e) {
    var t;
    var n = 0;
    while (--this.decodej >= 0) {
      this.output[n] = this.output[this.decodei];
      this.decodei = ++this.decodei & 8191;
      if (++n == e) return;
    }
    for (;;) {
      t = this.decode_c();
      if (t <= 255) {
        this.output[n] = t;
        if (++n == e) return;
      } else {
        this.decodej = t - 253;
        this.decodei = (n - this.decode_p() - 1) & 8191;
        while (--this.decodej >= 0) {
          this.output[n] = this.output[this.decodei];
          this.decodei = ++this.decodei & 8191;
          if (++n == e) return;
        }
      }
    }
  };
  this.decode_c = function () {
    var e;
    var t = 0;
    if (this.blockSize == 0) {
      this.blockSize = this.getBits(16);
      this.read_p(19, 5, 3);
      this.read_c();
      this.read_p(14, 4, -1);
    }
    this.blockSize--;
    e = this.c_Table[this.bitBuffer >> 4];
    if (e >= 510) {
      t = 1 << 3;
      do {
        e = this.bitBuffer & t ? this.r_Tree[e] : this.l_Tree[e];
        t >>= 1;
      } while (e >= 510);
    }
    this.fillBuffer(this.c_Len[e]);
    return e & 65535;
  };
  this.decode_p = function () {
    var e = this.p_Table[this.bitBuffer >> 8];
    var t = 0;
    if (e >= 14) {
      t = 1 << 7;
      do {
        e = this.bitBuffer & t ? this.r_Tree[e] : this.l_Tree[e];
        t >>= 1;
      } while (e >= 14);
    }
    this.fillBuffer(this.p_Len[e]);
    if (e != 0) e = (1 << (e - 1)) + this.getBits(e - 1);
    return e & 65535;
  };
  this.read_c = function () {
    var e;
    var t = 0;
    var n = 0;
    var r = this.getBits(9);
    if (r == 0) {
      e = this.getBits(9);
      for (t = 0; t < 510; ++t) this.c_Len[t] = 0;
      for (t = 0; t < 4096; ++t) this.c_Table[t] = e;
    } else {
      while (t < r) {
        e = this.p_Table[this.bitBuffer >> 8];
        if (e >= 19) {
          n = 1 << 7;
          do {
            e = this.bitBuffer & n ? this.r_Tree[e] : this.l_Tree[e];
            n >>= 1;
          } while (e >= 19);
        }
        this.fillBuffer(this.p_Len[e]);
        if (e <= 2) {
          if (e == 0) e = 1;
          else if (e == 1) e = this.getBits(4) + 3;
          else e = this.getBits(9) + 20;
          while (--e >= 0) this.c_Len[t++] = 0;
        } else {
          this.c_Len[t++] = e - 2;
        }
      }
      while (t < 510) this.c_Len[t++] = 0;
      this.makeTable(510, this.c_Len, 12, this.c_Table);
    }
  };
  this.read_p = function (e, t, n) {
    var r;
    var i = 0;
    var s = 0;
    var o = this.getBits(t);
    if (o == 0) {
      r = this.getBits(t);
      for (i = 0; i < e; ++i) this.p_Len[i] = 0;
      for (i = 0; i < 256; ++i) this.p_Table[i] = r;
    } else {
      while (i < o) {
        r = this.bitBuffer >> 13;
        if (r == 7) {
          s = 1 << 12;
          while (s & this.bitBuffer) {
            s >>= 1;
            r++;
          }
        }
        this.fillBuffer(r < 7 ? 3 : r - 3);
        this.p_Len[i++] = r;
        if (i == n) {
          r = this.getBits(2);
          while (--r >= 0) this.p_Len[i++] = 0;
        }
      }
      while (i < e) this.p_Len[i++] = 0;
      this.makeTable(e, this.p_Len, 8, this.p_Table);
    }
  };
  this.getBits = function (e) {
    var t = this.bitBuffer >> (16 - e);
    this.fillBuffer(e);
    return t & 65535;
  };
  this.fillBuffer = function (e) {
    var t;
    this.bitBuffer = (this.bitBuffer << e) & 65535;
    while (e > this.bitCount) {
      this.bitBuffer |= this.subBuffer << (e -= this.bitCount);
      this.bitBuffer &= 65535;
      if (this.fillBufferSize == 0) {
        this.fillIndex = 0;
        t = this.srcSize > 4064 ? 4064 : this.srcSize;
        if (t > 0) {
          this.source.pos = this.srcPos;
          this.buffer = this.source.readBytes(0, t);
          this.srcPos += t;
          this.srcSize -= t;
        }
        this.fillBufferSize = t;
      }
      if (this.fillBufferSize > 0) {
        this.fillBufferSize--;
        this.subBuffer = this.buffer[this.fillIndex++].charCodeAt(0);
      } else {
        this.subBuffer = 0;
      }
      this.bitCount = 8;
    }
    this.bitBuffer |= this.subBuffer >> (this.bitCount -= e);
    this.bitBuffer &= 65535;
  };
  this.makeTable = function (e, t, n, r) {
    var i = e;
    var s;
    var o;
    var u;
    var a;
    var f;
    var l;
    var c;
    var h;
    var p;
    var d = new Array();
    var v = new Array();
    var m = new Array();
    var g = 1 << (15 - n);
    for (o = 0; o < e; ++o) d[o] = 0;
    for (o = 0; o < e; ++o) d[t[o]]++;
    m[1] = 0;
    for (o = 1; o < 17; ++o) m[o + 1] = (m[o] + (d[o] << (16 - o))) & 65535;
    if (m[17] != 0) return false;
    u = 16 - n;
    for (o = 1; o <= n; ++o) {
      m[o] >>= u;
      v[o] = 1 << (n - o);
    }
    while (o < 17) v[o] = 1 << (16 - o++);
    o = m[n + 1] >> u;
    if (o != 0) {
      a = 1 << n;
      while (o != a) r[o++] = 0;
    }
    for (s = 0; s < e; ++s) {
      if ((f = t[s]) == 0) continue;
      l = m[f] + v[f];
      if (f <= n) {
        for (o = m[f]; o < l; ++o) r[o] = s;
      } else {
        o = f - n;
        a = m[f];
        c = a >> u;
        h = r;
        while (o != 0) {
          if (h[c] == 0) {
            this.l_Tree[i] = 0;
            this.r_Tree[i] = 0;
            h[c] = i++;
          }
          p = a & g ? this.r_Tree : this.l_Tree;
          a <<= 1;
          o--;
        }
        p[h[c]] = s;
      }
      m[f] = l;
    }
    return true;
  };
}
function LHaHeader(e) {
  this.size;
  this.checksum;
  this.method;
  this.packed;
  this.original;
  this.timeStamp;
  this.attribute;
  this.level;
  this.nameLength;
  this.name;
  e.endian = "LITTLE";
  e.pos = 0;
  this.size = e.readByte();
  this.checksum = e.readByte();
  this.method = e.readMultiByte(5, "txt");
  this.packed = e.readInt();
  this.original = e.readInt();
  this.timeStamp = e.readInt();
  this.attribute = e.readByte();
  this.level = e.readByte();
  this.nameLength = e.readByte();
  this.name = e.readMultiByte(this.nameLength, "txt");
  e.readShort();
}
var CODEF_AUDIO_CONTEXT = null;
var CODEF_AUDIO_NODE = null;
var YmConst_BUFFER_SIZE = 8192;
var YmConst_PLAYER_FREQ = 48e3;
var YmConst_DRUM_PREC = 15;
var YmConst_AMSTRAD_FREQ = 1e6;
var YmConst_ATARI_FREQ = 2e6;
var YmConst_SPECTRUM_FREQ = 1773400;
var YmConst_INTERLEAVED = 1;
var YmConst_DRUM_SIGNED = 2;
var YmConst_DRUM_4BITS = 4;
var YmConst_TIME_CONTROL = 8;
var YmConst_LOOP_MODE = 16;
var YmConst_MFP_PREDIV = [0, 4, 10, 16, 50, 64, 100, 200];
var YmConst_MONO = [
  0.00063071586250394, 0.00163782667521185, 0.00269580167037975,
  0.00383515935748365, 0.00590024516535946, 0.00787377544480728,
  0.01174962614825892, 0.01602221747489853, 0.02299061047191789,
  0.03141371908729311, 0.04648986276843572, 0.06340728985463016,
  0.09491256447035126, 0.13414919481999166, 0.21586759036022013,
  0.3333333333333333,
];
var YmConst_STEREO = [
  0.00094607379375591, 0.00245674001281777, 0.00404370250556963,
  0.00575273903622547, 0.00885036774803918, 0.01181066316721091,
  0.01762443922238838, 0.02403332621234779, 0.03448591570787683,
  0.04712057863093966, 0.06973479415265357, 0.09511093478194525,
  0.1423688467055269, 0.20122379222998749, 0.3238013855403302, 0.5,
];
var YmConst_ENVELOPES = [
  15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6,
  5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8,
  7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7,
  8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5,
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10,
  9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
  1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8,
  7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11, 10,
  9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
  1, 0, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15,
  14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
(function () {
  "use strict";
  function e(e, t) {
    var n = Object.create(null, {
      endian: { value: 1, writable: true },
      length: { value: 0, writable: true },
      index: { value: 0, writable: true },
      buffer: { value: null, writable: true },
      view: { value: null, writable: true },
      bytesAvailable: {
        get: function () {
          return this.length - this.index;
        },
      },
      position: {
        get: function () {
          return this.index;
        },
        set: function (e) {
          if (e < 0) e = 0;
          else if (e > this.length) e = this.length;
          this.index = e;
        },
      },
      clear: {
        value: function () {
          this.buffer = new ArrayBuffer();
          this.view = null;
          this.index = this.length = 0;
        },
      },
      readAt: {
        value: function (e) {
          return this.view.getUint8(e);
        },
      },
      readByte: {
        value: function () {
          return this.view.getInt8(this.index++);
        },
      },
      readShort: {
        value: function () {
          var e = this.view.getInt16(this.index, this.endian);
          this.index += 2;
          return e;
        },
      },
      readInt: {
        value: function () {
          var e = this.view.getInt32(this.index, this.endian);
          this.index += 4;
          return e;
        },
      },
      readUbyte: {
        value: function () {
          return this.view.getUint8(this.index++);
        },
      },
      readUshort: {
        value: function () {
          var e = this.view.getUint16(this.index, this.endian);
          this.index += 2;
          return e;
        },
      },
      readUint: {
        value: function () {
          var e = this.view.getUint32(this.index, this.endian);
          this.index += 4;
          return e;
        },
      },
      readBytes: {
        value: function (e, t, n) {
          var r = e.view,
            i = this.index,
            s = this.view;
          if ((n += i) > this.length) n = this.length;
          for (; i < n; ++i) r.setUint8(t++, s.getUint8(i));
          this.index = i;
        },
      },
      readString: {
        value: function (e) {
          var t = this.index,
            n = this.view,
            r = "";
          if ((e += t) > this.length) e = this.length;
          for (; t < e; ++t) r += String.fromCharCode(n.getUint8(t));
          this.index = e;
          return r;
        },
      },
      writeAt: {
        value: function (e, t) {
          this.view.setUint8(e, t);
        },
      },
      writeByte: {
        value: function (e) {
          this.view.setInt8(this.index++, e);
        },
      },
      writeShort: {
        value: function (e) {
          this.view.setInt16(this.index, e);
          this.index += 2;
        },
      },
      writeInt: {
        value: function (e) {
          this.view.setInt32(this.index, e);
          this.index += 4;
        },
      },
    });
    n.buffer = e;
    n.view = new DataView(e);
    n.length = e.byteLength;
    return Object.seal(n);
  }
  function t() {
    return Object.create(null, {
      l: { value: 0, writable: true },
      r: { value: 0, writable: true },
      next: { value: null, writable: true },
    });
  }
  function n() {
    return Object.create(null, {
      player: { value: null, writable: true },
      channels: { value: [], writable: true },
      buffer: { value: [], writable: true },
      samplesTick: { value: 0, writable: true },
      samplesLeft: { value: 0, writable: true },
      remains: { value: 0, writable: true },
      completed: { value: 0, writable: true },
      bufferSize: {
        get: function () {
          return this.buffer.length;
        },
        set: function (e) {
          var n,
            r = this.buffer.length || 0;
          if (e == r || e < 512) return;
          this.buffer.length = e;
          if (e > r) {
            this.buffer[r] = t();
            for (n = ++r; n < e; ++n)
              this.buffer[n] = this.buffer[n - 1].next = t();
          }
        },
      },
      complete: {
        get: function () {
          return this.completed;
        },
        set: function (e) {
          this.completed = e ^ this.player.loopSong;
        },
      },
      reset: {
        value: function () {
          var e = this.channels[0],
            t = this.buffer[0];
          this.samplesLeft = 0;
          this.remains = 0;
          this.completed = 0;
          while (e) {
            e.initialize();
            e = e.next;
          }
          while (t) {
            t.l = t.r = 0;
            t = t.next;
          }
        },
      },
      restore: { configurable: true, value: function () {} },
    });
  }
  function r() {
    var t = Object.create(null, {
      context: { value: null, writable: true },
      node: { value: null, writable: true },
      analyse: { value: 0, writable: true },
      endian: { value: 0, writable: true },
      sampleRate: { value: 0, writable: true },
      playSong: { value: 0, writable: true },
      lastSong: { value: 0, writable: true },
      version: { value: 0, writable: true },
      title: { value: "", writable: true },
      channels: { value: 0, writable: true },
      loopSong: { value: 1, writable: true },
      speed: { value: 0, writable: true },
      tempo: { value: 0, writable: true },
      mixer: { value: null, writable: true },
      tick: { value: 0, writable: true },
      paused: { value: 0, writable: true },
      callback: { value: null, writable: true },
      quality: {
        configurable: true,
        set: function (e) {
          this.callback = e
            ? this.mixer.accurate.bind(this.mixer)
            : this.mixer.fast.bind(this.mixer);
        },
      },
      toggle: {
        value: function (e) {
          this.mixer.channels[e].mute ^= 1;
        },
      },
      setup: { configurable: true, value: function () {} },
      load: {
        value: function (t) {
          this.version = 0;
          this.playSong = 0;
          this.lastSong = 0;
          this.mixer.restore();
          if (!t.view) t = e(t);
          t.position = 0;
          if (t.readUint() == 67324752) {
            if (window.neoart.Unzip) {
              var n = i(t);
              t = n.uncompress(n.entries[0]);
            } else {
              throw "Unzip support is not available.";
            }
          }
          t.endian = this.endian;
          t.position = 0;
          this.loader(t);
          if (this.version) this.setup();
          return this.version;
        },
      },
      play: {
        value: function () {
          var e, t;
          if (!this.version) return;
          if (this.paused) {
            this.paused = 0;
          } else {
            this.initialize();
            this.node = this.context.createScriptProcessor(
              this.mixer.bufferSize
            );
            this.node.onaudioprocess = this.callback;
          }
          if (this.analyse && window.neoart.Flectrum) {
            t = window.neoart.analyserNode = this.context.createAnalyser();
            this.node.connect(t);
            t.connect(this.context.destination);
          } else {
            this.node.connect(this.context.destination);
          }
          e = document.createEvent("Event");
          e.initEvent("flodPlay", true, false);
          document.dispatchEvent(e);
        },
      },
      pause: {
        value: function () {
          if (this.node) {
            this.node.disconnect();
            this.paused = 1;
            var e = document.createEvent("Event");
            e.initEvent("flodPause", true, false);
            document.dispatchEvent(e);
          }
        },
      },
      stop: {
        value: function () {
          if (this.node) {
            this.node.disconnect();
            this.node.onaudioprocess = this.node = null;
            this.paused = 0;
            if (this.restore) this.restore();
            var e = document.createEvent("Event");
            e.initEvent("flodStop", true, false);
            document.dispatchEvent(e);
          }
        },
      },
      reset: {
        value: function () {
          this.tick = 0;
          this.mixer.initialize();
          this.mixer.samplesTick = ((this.sampleRate * 2.5) / this.tempo) >> 0;
        },
      },
    });
    if (!window.neoart.audioContext)
      window.neoart.audioContext = new AudioContext();
    t.context = window.neoart.audioContext;
    t.sampleRate = t.context.sampleRate;
    return t;
  }
  function i(t) {
    function S(e) {
      var t = Object.create(null, {
        count: { value: null, writable: true },
        symbol: { value: null, writable: true },
      });
      t.count = new Uint16Array(e);
      t.symbol = new Uint16Array(e);
      return Object.seal(t);
    }
    function x() {
      var t = Object.create(null, {
        output: { value: null, writable: true },
        inpbuf: { value: null, writable: true },
        inpcnt: { value: 0, writable: true },
        outcnt: { value: 0, writable: true },
        bitbuf: { value: 0, writable: true },
        bitcnt: { value: 0, writable: true },
        flencode: { value: null, writable: true },
        fdiscode: { value: null, writable: true },
        dlencode: { value: null, writable: true },
        ddiscode: { value: null, writable: true },
        input: {
          set: function (t) {
            this.inpbuf = t[0];
            this.inpbuf.endian = t[2];
            this.inpbuf.position = 0;
            this.inpcnt = 0;
            this.output = e(new ArrayBuffer(t[1]));
            this.output.endian = t[2];
            this.output.position = 0;
            this.outcnt = 0;
          },
        },
        inflate: {
          value: function () {
            var e, t, n;
            do {
              t = this.bits(1);
              n = this.bits(2);
              e =
                n == 0
                  ? this.stored()
                  : n == 1
                  ? this.codes(this.flencode, this.fdiscode)
                  : n == 2
                  ? this.dynamic()
                  : 1;
              if (e) throw o;
            } while (!t);
          },
        },
        initialize: {
          value: function () {
            var e = new Uint8Array(288),
              t = 0;
            this.flencode = S(288);
            this.fdiscode = S(30);
            for (; t < 144; ++t) e[t] = 8;
            for (; t < 256; ++t) e[t] = 9;
            for (; t < 280; ++t) e[t] = 7;
            for (; t < 288; ++t) e[t] = 8;
            this.construct(this.fdiscode, e, 288);
            for (t = 0; t < 30; ++t) e[t] = 5;
            this.construct(this.fdiscode, e, 30);
            this.dlencode = S(286);
            this.ddiscode = S(30);
          },
        },
        construct: {
          value: function (e, t, n) {
            var r = 0,
              i = 1,
              s = new Uint16Array(16),
              o = 0;
            for (; r < 16; ++r) e.count[r] = 0;
            for (; o < n; ++o) e.count[t[o]]++;
            if (e.count[0] == n) return 0;
            for (r = 1; r < 16; ++r) {
              i <<= 1;
              i -= e.count[r];
              if (i < 0) return i;
            }
            for (r = 1; r < 15; ++r) s[r + 1] = s[r] + e.count[r];
            for (o = 0; o < n; ++o) if (t[o] != 0) e.symbol[s[t[o]]++] = o;
            return i;
          },
        },
        bits: {
          value: function (e) {
            var t = this.bitbuf,
              n = this.inpbuf.length;
            while (this.bitcnt < e) {
              if (this.inpcnt == n) throw u;
              t |= this.inpbuf.readAt(this.inpcnt++) << this.bitcnt;
              this.bitcnt += 8;
            }
            this.bitbuf = t >> e;
            this.bitcnt -= e;
            return t & ((1 << e) - 1);
          },
        },
        codes: {
          value: function (e, t) {
            var n, r, i, s;
            do {
              s = this.decode(e);
              if (s < 0) return s;
              if (s < 256) {
                this.output.writeAt(this.outcnt++, s);
              } else if (s > 256) {
                s -= 257;
                if (s >= 29) throw ERRRO7;
                r = g[s] + this.bits(y[s]);
                s = this.decode(t);
                if (s < 0) return s;
                n = b[s] + this.bits(w[s]);
                if (n > this.outcnt) throw f;
                i = this.outcnt - n;
                while (r--)
                  this.output.writeAt(this.outcnt++, this.output.readAt(i++));
              }
            } while (s != 256);
            return 0;
          },
        },
        decode: {
          value: function (e) {
            var t = this.bitbuf,
              n = 0,
              r,
              i = 0,
              s = 0,
              o = this.inpbuf.length,
              a = this.bitcnt,
              f = 1;
            while (1) {
              while (a--) {
                n |= t & 1;
                t >>= 1;
                r = e.count[f];
                if (n < i + r) {
                  this.bitbuf = t;
                  this.bitcnt = (this.bitcnt - f) & 7;
                  return e.symbol[s + (n - i)];
                }
                s += r;
                i += r;
                i <<= 1;
                n <<= 1;
                ++f;
              }
              a = 16 - f;
              if (!a) break;
              if (this.inpcnt == o) throw u;
              t = this.inpbuf.readAt(this.inpcnt++);
              if (a > 8) a = 8;
            }
            return -9;
          },
        },
        stored: {
          value: function () {
            var e = this.inpbuf.length,
              t;
            this.bitbuf = this.bitcnt = 0;
            if (this.inpcnt + 4 > e) throw u;
            t = this.inpbuf.readAt(this.inpcnt++);
            t |= this.inpbuf.readAt(this.inpcnt++) << 8;
            if (
              this.inpbuf.readAt(this.inpcnt++) != (~t & 255) ||
              this.inpbuf.readAt(this.inpcnt++) != ((~t >> 8) & 255)
            )
              throw l;
            if (this.inpcnt + t > e) throw u;
            while (t--)
              this.output.writeAt(
                this.outcnt++,
                this.inpbuf.readAt(this.inpcnt++)
              );
            return 0;
          },
        },
        dynamic: {
          value: function () {
            var e = new Uint8Array(316),
              t,
              n = 0,
              r,
              i = this.bits(5) + 257,
              s = this.bits(5) + 1,
              o = this.bits(4) + 4,
              u = i + s,
              a;
            if (i > 286 || s > 30) throw c;
            for (; n < o; ++n) e[E[n]] = this.bits(3);
            for (; n < 19; ++n) e[E[n]] = 0;
            t = this.construct(this.dlencode, e, 19);
            if (t) throw h;
            n = 0;
            while (n < u) {
              a = this.decode(this.dlencode);
              if (a < 16) {
                e[n++] = a;
              } else {
                r = 0;
                if (a == 16) {
                  if (n == 0) throw p;
                  r = e[n - 1];
                  a = 3 + this.bits(2);
                } else if (a == 17) {
                  a = 3 + this.bits(3);
                } else {
                  a = 11 + this.bits(7);
                }
                if (n + a > u) throw d;
                while (a--) e[n++] = r;
              }
            }
            t = this.construct(this.dlencode, e, i);
            if (t < 0 || (t > 0 && i - this.dlencode.count[0] != 1)) throw v;
            t = this.construct(this.ddiscode, e.subarray(i), s);
            if (t < 0 || (t > 0 && s - this.ddiscode.count[0] != 1)) throw m;
            return this.codes(this.dlencode, this.ddiscode);
          },
        },
      });
      t.initialize();
      return Object.seal(t);
    }
    function T() {
      return Object.create(null, {
        name: { value: "", writable: true },
        extra: { value: null, writable: true },
        version: { value: 0, writable: true },
        flag: { value: 0, writable: true },
        method: { value: 0, writable: true },
        time: { value: 0, writable: true },
        crc: { value: 0, writable: true },
        compressed: { value: 0, writable: true },
        size: { value: 0, writable: true },
        offset: { value: 0, writable: true },
        date: {
          get: function () {
            return new Date(
              ((this.time >> 25) & 127) + 1980,
              ((this.time >> 21) & 15) - 1,
              (this.time >> 16) & 31,
              (this.time >> 11) & 31,
              (this.time >> 5) & 63,
              (this.time & 31) << 1
            );
          },
        },
        isDirectory: {
          get: function () {
            return this.name.charAt(this.name.length - 1) == "/";
          },
        },
      });
    }
    if (!t) return null;
    var n = "The archive is either in unknown format or damaged.",
      r = "Unexpected end of archive.",
      i = "Encrypted archive not supported.",
      s = "Compression method not supported.",
      o = "Invalid block type.",
      u = "Available inflate data did not terminate.",
      a = "Invalid literal/length or distance code.",
      f = "Distance is too far back.",
      l = "Stored block length did not match one's complement.",
      c = "Too many length or distance codes.",
      h = "Code lengths codes incomplete.",
      p = "Repeat lengths with no first length.",
      d = "Repeat more than specified lengths.",
      v = "Invalid literal/length code lengths.",
      m = "Invalid distance code lengths.",
      g = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59,
        67, 83, 99, 115, 131, 163, 195, 227, 258,
      ],
      y = [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
        5, 5, 5, 5, 0,
      ],
      b = [
        1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385,
        513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
      ],
      w = [
        0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10,
        10, 11, 11, 12, 12, 13, 13,
      ],
      E = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    var N = Object.create(null, {
      endian: { value: 1, writable: true },
      entries: { value: null, writable: true },
      stream: { value: null, writable: true },
      uncompress: {
        value: function (t) {
          var n = this.stream,
            r,
            i = false,
            o,
            u,
            a,
            f,
            l;
          if (!t) return null;
          if (typeof t == "string") {
            f = this.entries.length;
            for (o = 0; o < f; ++o) {
              a = this.entries[o];
              if (a.name == t) {
                t = a;
                i = true;
                break;
              }
            }
            if (!i) return null;
          }
          n.position = t.offset + 28;
          l = n.readUshort();
          n.position += t.name.length + l;
          if (t.compressed) {
            r = e(new ArrayBuffer(t.compressed), this.endian);
            n.readBytes(r, 0, t.compressed);
            switch (t.method) {
              case 0:
                return r;
                break;
              case 8:
                u = x();
                u.input = [r, t.size, this.endian];
                u.inflate();
                return u.output;
                break;
              default:
                throw s;
                break;
            }
          }
        },
      },
      parseCentral: {
        value: function () {
          var t = this.stream,
            n,
            s = e(new ArrayBuffer(46), this.endian),
            o,
            u = this.entries.length,
            a;
          for (o = 0; o < u; ++o) {
            t.readBytes(s, 0, 46);
            s.position = 0;
            if (s.readUint() != 33639248) throw r;
            s.position += 24;
            a = s.readUshort();
            if (!a) throw r;
            n = T();
            n.name = t.readString(a);
            a = s.readUshort();
            if (a) {
              n.extra = e(new ArrayBuffer(a), this.endian);
              t.readBytes(n.extra, 0, a);
            }
            t.position += s.readUshort();
            s.position = 6;
            n.version = s.readUshort();
            n.flag = s.readUshort();
            if ((n.flag & 1) == 1) throw i;
            n.method = s.readUshort();
            n.time = s.readUint();
            n.crc = s.readUint();
            n.compressed = s.readUint();
            n.size = s.readUint();
            s.position = 42;
            n.offset = s.readUint();
            Object.freeze(n);
            this.entries[o] = n;
          }
        },
      },
      parseEnd: {
        value: function () {
          var e = this.stream,
            t = e.length - 22,
            r = t - 65536;
          if (r < 0) r = 0;
          do {
            if (e.readAt(t) != 80) continue;
            e.position = t;
            if (e.readUint() == 101010256) break;
          } while (--t > r);
          if (t == r) throw n;
          e.position = t + 10;
          this.entries = [];
          this.entries.length = e.readUshort();
          e.position = t + 16;
          e.position = e.readUint();
          this.parseCentral();
        },
      },
    });
    if (!t.view) t = e(t);
    t.endian = 1;
    t.position = 0;
    N.stream = t;
    N.parseEnd();
    return Object.seal(N);
  }
  function s(e) {
    var t = Object.create(null, {
      next: { value: null, writable: true },
      mute: { value: 0, writable: true },
      panning: { value: 0, writable: true },
      delay: { value: 0, writable: true },
      pointer: { value: 0, writable: true },
      length: { value: 0, writable: true },
      audena: { value: 0, writable: true },
      audcnt: { value: 0, writable: true },
      audloc: { value: 0, writable: true },
      audper: { value: 0, writable: true },
      audvol: { value: 0, writable: true },
      timer: { value: 0, writable: true },
      level: { value: 0, writable: true },
      ldata: { value: 0, writable: true },
      rdata: { value: 0, writable: true },
      enabled: {
        get: function () {
          return this.audena;
        },
        set: function (e) {
          if (e == this.audena) return;
          this.audena = e;
          this.audloc = this.pointer;
          this.audcnt = this.pointer + this.length;
          this.timer = 1;
          if (e) this.delay += 2;
        },
      },
      period: {
        set: function (e) {
          if (e < 0) e = 0;
          else if (e > 65535) e = 65535;
          this.audper = e;
        },
      },
      volume: {
        set: function (e) {
          if (e < 0) e = 0;
          else if (e > 64) e = 64;
          this.audvol = e;
        },
      },
      resetData: {
        value: function () {
          this.ldata = 0;
          this.rdata = 0;
        },
      },
      initialize: {
        value: function () {
          this.audena = 0;
          this.audcnt = 0;
          this.audloc = 0;
          this.audper = 50;
          this.audvol = 0;
          this.timer = 0;
          this.ldata = 0;
          this.rdata = 0;
          this.delay = 0;
          this.pointer = 0;
          this.length = 0;
        },
      },
    });
    t.panning = t.level = (++e & 2) == 0 ? -1 : 1;
    return Object.seal(t);
  }
  function o() {
    return Object.create(null, {
      active: { value: 0, writable: true },
      forced: { value: -1, writable: true },
      l0: { value: 0, writable: true },
      l1: { value: 0, writable: true },
      l2: { value: 0, writable: true },
      l3: { value: 0, writable: true },
      l4: { value: 0, writable: true },
      r0: { value: 0, writable: true },
      r1: { value: 0, writable: true },
      r2: { value: 0, writable: true },
      r3: { value: 0, writable: true },
      r4: { value: 0, writable: true },
      initialize: {
        value: function () {
          this.l0 = this.l1 = this.l2 = this.l3 = this.l4 = 0;
          this.r0 = this.r1 = this.r2 = this.r3 = this.r4 = 0;
        },
      },
      process: {
        value: function (e, t) {
          var n = 0.52133458435322,
            r = 0.4860348337215757,
            i = 0.9314955486749749,
            s = 1 - r;
          if (e == 0) {
            this.l0 = r * t.l + s * this.l0;
            this.r0 = r * t.r + s * this.r0;
            s = 1 - i;
            t.l = this.l1 = i * this.l0 + s * this.l1;
            t.r = this.r1 = i * this.r0 + s * this.r1;
          }
          if ((this.active | this.forced) > 0) {
            s = 1 - n;
            this.l2 = n * t.l + s * this.l2;
            this.r2 = n * t.r + s * this.r2;
            this.l3 = n * this.l2 + s * this.l3;
            this.r3 = n * this.r2 + s * this.r3;
            t.l = this.l4 = n * this.l3 + s * this.l4;
            t.r = this.r4 = n * this.r3 + s * this.r4;
          }
          if (t.l > 1) t.l = 1;
          else if (t.l < -1) t.l = -1;
          if (t.r > 1) t.r = 1;
          else if (t.r < -1) t.r = -1;
        },
      },
    });
  }
  function u() {
    return Object.create(null, {
      note: { value: 0, writable: true },
      sample: { value: 0, writable: true },
      effect: { value: 0, writable: true },
      param: { value: 0, writable: true },
    });
  }
  function a() {
    return Object.create(null, {
      name: { value: "", writable: true },
      length: { value: 0, writable: true },
      loop: { value: 0, writable: true },
      repeat: { value: 0, writable: true },
      volume: { value: 0, writable: true },
      pointer: { value: 0, writable: true },
      loopPtr: { value: 0, writable: true },
    });
  }
  function f() {
    return Object.create(null, {
      pattern: { value: 0, writable: true },
      transpose: { value: 0, writable: true },
    });
  }
  function l() {
    var e = n();
    Object.defineProperties(e, {
      filter: { value: null, writable: true },
      model: { value: 1, writable: true },
      memory: { value: [], writable: true },
      loopPtr: { value: 0, writable: true },
      loopLen: { value: 4, writable: true },
      clock: { value: 0, writable: true },
      master: { value: 0, writable: true },
      ready: { value: 0, writable: true },
      volume: {
        set: function (e) {
          if (e > 0) {
            if (e > 64) e = 64;
            this.master = (e / 64) * 0.00390625;
          } else {
            this.master = 0;
          }
        },
      },
      initialize: {
        value: function () {
          var e = this.memory.length,
            t = e + this.loopLen;
          this.reset();
          this.filter.initialize();
          if (!this.ready) {
            this.ready = 1;
            this.loopPtr = e;
            for (; e < t; ++e) this.memory[e] = 0;
          }
        },
      },
      restore: {
        value: function () {
          this.ready = 0;
          this.memory.length = 0;
        },
      },
      store: {
        value: function (e, t, n) {
          var r,
            i,
            s = e.position,
            o = this.memory.length,
            u;
          if (n) e.position = n;
          u = e.position + t;
          if (u >= e.length) {
            r = u - e.length;
            t = e.length - e.position;
          }
          for (i = o, t += o; i < t; ++i) this.memory[i] = e.readByte();
          for (t += r; i < t; ++i) this.memory[i] = 0;
          if (n) e.position = s;
          return o;
        },
      },
      fast: {
        value: function (e) {
          var t,
            n,
            r,
            i,
            s = this.memory,
            o,
            u = 0,
            a,
            f = 0,
            i,
            l,
            c,
            h = this.bufferSize,
            p,
            d,
            v;
          if (this.completed) {
            if (!this.remains) {
              this.player.stop();
              return;
            }
            h = this.remains;
          }
          while (u < h) {
            if (!this.samplesLeft) {
              this.player.process();
              this.samplesLeft = this.samplesTick;
              if (this.completed) {
                h = u + this.samplesTick;
                if (h > this.bufferSize) {
                  this.remains = h - this.bufferSize;
                  h = this.bufferSize;
                }
              }
            }
            d = this.samplesLeft;
            if (u + d >= h) d = h - u;
            a = f + d;
            t = this.channels[0];
            while (t) {
              c = this.buffer[f];
              if (t.audena && t.audper > 60) {
                p = t.audper / this.clock;
                v = t.audvol * this.master;
                o = v * (1 - t.level);
                l = v * (1 + t.level);
                for (n = f; n < a; ++n) {
                  if (t.delay) {
                    t.delay--;
                  } else if (--t.timer < 1) {
                    if (!t.mute) {
                      v = s[t.audloc] * 0.0078125;
                      t.ldata = v * o;
                      t.rdata = v * l;
                    }
                    t.audloc++;
                    t.timer += p;
                    if (t.audloc >= t.audcnt) {
                      t.audloc = t.pointer;
                      t.audcnt = t.pointer + t.length;
                    }
                  }
                  c.l += t.ldata;
                  c.r += t.rdata;
                  c = c.next;
                }
              } else {
                for (n = f; n < a; ++n) {
                  c.l += t.ldata;
                  c.r += t.rdata;
                  c = c.next;
                }
              }
              t = t.next;
            }
            f = a;
            u += d;
            this.samplesLeft -= d;
          }
          v = this.model;
          s = this.filter;
          c = this.buffer[0];
          r = e.outputBuffer.getChannelData(0);
          i = e.outputBuffer.getChannelData(1);
          for (n = 0; n < h; ++n) {
            s.process(v, c);
            r[n] = c.l;
            i[n] = c.r;
            c.l = c.r = 0;
            c = c.next;
          }
        },
      },
    });
    e.channels[0] = s(0);
    e.channels[0].next = e.channels[1] = s(1);
    e.channels[1].next = e.channels[2] = s(2);
    e.channels[2].next = e.channels[3] = s(3);
    e.bufferSize = 8192;
    e.filter = o();
    e.master = 0.00390625;
    return Object.seal(e);
  }
  function c(e) {
    var t = r();
    Object.defineProperties(t, {
      quality: {
        set: function (e) {
          this.callback = this.mixer.fast.bind(this.mixer);
        },
      },
      stereo: {
        set: function (e) {
          var t = this.mixer.channels[0];
          if (e < 0) e = 0;
          else if (e > 1) e = 1;
          while (t) {
            t.level = e * t.panning;
            t = t.next;
          }
        },
      },
      volume: {
        set: function (e) {
          if (e < 0) e = 0;
          else if (e > 1) e = 1;
          this.mixer.master = e * 0.00390625;
        },
      },
      frequency: {
        value: function (e) {
          if (e) {
            this.mixer.clock = 3579545 / this.sampleRate;
            this.mixer.samplesTick = 735;
          } else {
            this.mixer.clock = 3546895 / this.sampleRate;
            this.mixer.samplesTick = 882;
          }
        },
      },
    });
    t.mixer = e || l();
    t.mixer.player = t;
    t.frequency(0);
    t.channels = 4;
    t.endian = 0;
    t.quality = 0;
    t.speed = 6;
    t.tempo = 125;
    return t;
  }
  function h() {
    return Object.create(null, {
      next: { value: null, writable: true },
      mute: { value: 0, writable: true },
      enabled: { value: 0, writable: true },
      sample: { value: null, writable: true },
      length: { value: 0, writable: true },
      index: { value: 0, writable: true },
      pointer: { value: 0, writable: true },
      delta: { value: 0, writable: true },
      fraction: { value: 0, writable: true },
      speed: { value: 0, writable: true },
      dir: { value: 0, writable: true },
      oldSample: { value: null, writable: true },
      oldLength: { value: 0, writable: true },
      oldPointer: { value: 0, writable: true },
      oldFraction: { value: 0, writable: true },
      oldSpeed: { value: 0, writable: true },
      oldDir: { value: 0, writable: true },
      volume: { value: 0, writable: true },
      lvol: { value: 0, writable: true },
      rvol: { value: 0, writable: true },
      panning: { value: 128, writable: true },
      lpan: { value: 0.5, writable: true },
      rpan: { value: 0.5, writable: true },
      ldata: { value: 0, writable: true },
      rdata: { value: 0, writable: true },
      mixCounter: { value: 0, writable: true },
      lmixRampU: { value: 0, writable: true },
      lmixDeltaU: { value: 0, writable: true },
      rmixRampU: { value: 0, writable: true },
      rmixDeltaU: { value: 0, writable: true },
      lmixRampD: { value: 0, writable: true },
      lmixDeltaD: { value: 0, writable: true },
      rmixRampD: { value: 0, writable: true },
      rmixDeltaD: { value: 0, writable: true },
      volCounter: { value: 0, writable: true },
      lvolDelta: { value: 0, writable: true },
      rvolDelta: { value: 0, writable: true },
      panCounter: { value: 0, writable: true },
      lpanDelta: { value: 0, writable: true },
      rpanDelta: { value: 0, writable: true },
      initialize: {
        value: function () {
          this.enabled = 0;
          this.sample = null;
          this.length = 0;
          this.index = 0;
          this.pointer = 0;
          this.delta = 0;
          this.fraction = 0;
          this.speed = 0;
          this.dir = 0;
          this.oldSample = null;
          this.oldLength = 0;
          this.oldPointer = 0;
          this.oldFraction = 0;
          this.oldSpeed = 0;
          this.oldDir = 0;
          this.volume = 0;
          this.lvol = 0;
          this.rvol = 0;
          this.panning = 128;
          this.lpan = 0.5;
          this.rpan = 0.5;
          this.ldata = 0;
          this.rdata = 0;
          this.mixCounter = 0;
          this.lmixRampU = 0;
          this.lmixDeltaU = 0;
          this.rmixRampU = 0;
          this.rmixDeltaU = 0;
          this.lmixRampD = 0;
          this.lmixDeltaD = 0;
          this.rmixRampD = 0;
          this.rmixDeltaD = 0;
          this.volCounter = 0;
          this.lvolDelta = 0;
          this.rvolDelta = 0;
          this.panCounter = 0;
          this.lpanDelta = 0;
          this.rpanDelta = 0;
        },
      },
    });
  }
  function p() {
    return Object.create(null, {
      name: { value: "", writable: true },
      bits: { value: 8, writable: true },
      volume: { value: 0, writable: true },
      length: { value: 0, writable: true },
      data: { value: [], writable: true },
      loopMode: { value: 0, writable: true },
      loopStart: { value: 0, writable: true },
      loopLen: { value: 0, writable: true },
      store: {
        value: function (e) {
          var t = 0,
            n,
            r = this.length,
            i,
            s,
            o,
            u;
          if (!this.loopLen) this.loopMode = 0;
          i = e.position;
          if (this.loopMode) {
            r = this.loopStart + this.loopLen;
            this.data = new Float32Array(r + 1);
          } else {
            this.data = new Float32Array(this.length + 1);
          }
          if (this.bits == 8) {
            o = i + r;
            if (o > e.length) r = e.length - i;
            for (n = 0; n < r; n++) {
              u = e.readByte() + t;
              if (u < -128) u += 256;
              else if (u > 127) u -= 256;
              this.data[n] = u * 0.0078125;
              t = u;
            }
          } else {
            o = i + (r << 1);
            if (o > e.length) r = (e.length - i) >> 1;
            for (n = 0; n < r; n++) {
              u = e.readShort() + t;
              if (u < -32768) u += 65536;
              else if (u > 32767) u -= 65536;
              this.data[n] = u * 3051758e-11;
              t = u;
            }
          }
          o = i + length;
          if (!this.loopMode) {
            this.data[this.length] = 0;
          } else {
            this.length = this.loopStart + this.loopLen;
            if (this.loopMode == 1) {
              this.data[r] = this.data[this.loopStart];
            } else {
              this.data[r] = this.data[r - 1];
            }
          }
          if (r != this.length) {
            s = this.data[r - 1];
            for (n = r; n < this.length; n++) this.data[n] = s;
          }
          if (o < e.length) e.position = o;
          else e.position = e.length - 1;
        },
      },
    });
  }
  function d() {
    var e = n();
    Object.defineProperties(e, {
      setup: {
        value: function (e) {
          var t = 1;
          this.channels.length = e;
          this.channels[0] = h();
          for (; t < e; ++t) this.channels[t] = this.channels[t - 1].next = h();
        },
      },
      initialize: {
        value: function () {
          this.reset();
        },
      },
      fast: {
        value: function (e) {
          var t,
            n,
            r,
            i,
            s = 0,
            o,
            u = 0,
            a,
            f,
            l,
            c = this.bufferSize,
            h,
            p;
          if (this.completed) {
            if (!this.remains) {
              this.player.stop();
              return;
            }
            c = this.remains;
          }
          while (s < c) {
            if (!this.samplesLeft) {
              this.player.process();
              this.player.fast();
              this.samplesLeft = this.samplesTick;
              if (this.completed) {
                c = s + this.samplesTick;
                if (c > this.bufferSize) {
                  this.remains = c - this.bufferSize;
                  c = this.bufferSize;
                }
              }
            }
            h = this.samplesLeft;
            if (s + h >= c) h = c - s;
            o = u + h;
            t = this.channels[0];
            while (t) {
              if (!t.enabled) {
                t = t.next;
                continue;
              }
              f = t.sample;
              n = f.data;
              l = this.buffer[u];
              for (i = u; i < o; ++i) {
                if (t.index != t.pointer) {
                  if (t.index >= t.length) {
                    if (!f.loopMode) {
                      t.enabled = 0;
                      break;
                    } else {
                      t.pointer = f.loopStart + (t.index - t.length);
                      t.length = f.length;
                      if (f.loopMode == 2) {
                        if (!t.dir) {
                          t.dir = f.length + f.loopStart - 1;
                        } else {
                          t.dir = 0;
                        }
                      }
                    }
                  } else t.pointer = t.index;
                  if (!t.mute) {
                    if (!t.dir) p = n[t.pointer];
                    else p = n[t.dir - t.pointer];
                    t.ldata = p * t.lvol;
                    t.rdata = p * t.rvol;
                  } else {
                    t.ldata = 0;
                    t.rdata = 0;
                  }
                }
                t.index = t.pointer + t.delta;
                if ((t.fraction += t.speed) >= 1) {
                  t.index++;
                  t.fraction--;
                }
                l.l += t.ldata;
                l.r += t.rdata;
                l = l.next;
              }
              t = t.next;
            }
            u = o;
            s += h;
            this.samplesLeft -= h;
          }
          l = this.buffer[0];
          r = e.outputBuffer.getChannelData(0);
          a = e.outputBuffer.getChannelData(1);
          for (i = 0; i < c; ++i) {
            if (l.l > 1) l.l = 1;
            else if (l.l < -1) l.l = -1;
            if (l.r > 1) l.r = 1;
            else if (l.r < -1) l.r = -1;
            r[i] = l.l;
            a[i] = l.r;
            l.l = l.r = 0;
            l = l.next;
          }
        },
      },
      accurate: {
        value: function (e) {
          var t,
            n,
            r,
            i,
            s,
            o,
            u = 0,
            a,
            f = 0,
            l,
            c,
            h,
            p,
            d,
            v = this.bufferSize,
            m,
            g;
          if (this.completed) {
            if (!this.remains) {
              this.player.stop();
              return;
            }
            v = this.remains;
          }
          while (u < v) {
            if (!this.samplesLeft) {
              this.player.process();
              this.player.accurate();
              this.samplesLeft = this.samplesTick;
              if (this.completed) {
                v = u + this.samplesTick;
                if (v > this.bufferSize) {
                  this.remains = v - this.bufferSize;
                  v = this.bufferSize;
                }
              }
            }
            m = this.samplesLeft;
            if (u + m >= v) m = v - u;
            a = f + m;
            t = this.channels[0];
            while (t) {
              if (!t.enabled) {
                t = t.next;
                continue;
              }
              h = t.sample;
              n = h.data;
              p = t.oldSample;
              if (p) r = p.data;
              d = this.buffer[f];
              for (o = f; o < a; ++o) {
                g = t.mute ? 0 : n[t.pointer];
                g += (n[t.pointer + t.dir] - g) * t.fraction;
                if ((t.fraction += t.speed) >= 1) {
                  s = t.fraction >> 0;
                  t.fraction -= s;
                  if (t.dir > 0) {
                    t.pointer += s;
                    if (t.pointer > t.length) {
                      t.fraction += t.pointer - t.length;
                      t.pointer = t.length;
                    }
                  } else {
                    t.pointer -= s;
                    if (t.pointer < t.length) {
                      t.fraction += t.length - t.pointer;
                      t.pointer = t.length;
                    }
                  }
                }
                if (!t.mixCounter) {
                  d.l += g * t.lvol;
                  d.r += g * t.rvol;
                  if (t.volCounter) {
                    t.lvol += t.lvolDelta;
                    t.rvol += t.rvolDelta;
                    t.volCounter--;
                  } else if (t.panCounter) {
                    t.lpan += t.lpanDelta;
                    t.rpan += t.rpanDelta;
                    t.panCounter--;
                    t.lvol = t.volume * t.lpan;
                    t.rvol = t.volume * t.rpan;
                  }
                } else {
                  if (p) {
                    l = t.mute ? 0 : r[t.oldPointer];
                    l += (r[t.oldPointer + t.oldDir] - l) * t.oldFraction;
                    if ((t.oldFraction += t.oldSpeed) > 1) {
                      s = t.oldFraction >> 0;
                      t.oldFraction -= s;
                      if (t.oldDir > 0) {
                        t.oldPointer += s;
                        if (t.oldPointer > t.oldLength) {
                          t.oldFraction += t.oldPointer - t.oldLength;
                          t.oldPointer = t.oldLength;
                        }
                      } else {
                        t.oldPointer -= s;
                        if (t.oldPointer < t.oldLength) {
                          t.oldFraction += t.oldLength - t.oldPointer;
                          t.oldPointer = t.oldLength;
                        }
                      }
                    }
                    d.l += g * t.lmixRampU + l * t.lmixRampD;
                    d.r += g * t.rmixRampU + l * t.rmixRampD;
                    t.lmixRampD -= t.lmixDeltaD;
                    t.rmixRampD -= t.rmixDeltaD;
                  } else {
                    d.l += g * t.lmixRampU;
                    d.r += g * t.rmixRampU;
                  }
                  t.lmixRampU += t.lmixDeltaU;
                  t.rmixRampU += t.rmixDeltaU;
                  t.mixCounter--;
                  if (t.oldPointer == t.oldLength) {
                    if (!p.loopMode) {
                      p = null;
                      t.oldPointer = 0;
                    } else if (p.loopMode == 1) {
                      t.oldPointer = p.loopStart;
                      t.oldLength = p.length;
                    } else {
                      if (t.oldDir > 0) {
                        t.oldPointer = p.length - 1;
                        t.oldLength = p.loopStart;
                        t.oldDir = -1;
                      } else {
                        t.oldFraction -= 1;
                        t.oldPointer = p.loopStart;
                        t.oldLength = p.length;
                        t.oldDir = 1;
                      }
                    }
                  }
                }
                if (t.pointer == t.length) {
                  if (!h.loopMode) {
                    t.enabled = 0;
                    break;
                  } else if (h.loopMode == 1) {
                    t.pointer = h.loopStart;
                    t.length = h.length;
                  } else {
                    if (t.dir > 0) {
                      t.pointer = h.length - 1;
                      t.length = h.loopStart;
                      t.dir = -1;
                    } else {
                      t.fraction -= 1;
                      t.pointer = h.loopStart;
                      t.length = h.length;
                      t.dir = 1;
                    }
                  }
                }
                d = d.next;
              }
              t = t.next;
            }
            f = a;
            u += m;
            this.samplesLeft -= m;
          }
          d = this.buffer[0];
          i = e.outputBuffer.getChannelData(0);
          c = e.outputBuffer.getChannelData(1);
          for (o = 0; o < v; ++o) {
            if (d.l > 1) d.l = 1;
            else if (d.l < -1) d.l = -1;
            if (d.r > 1) d.r = 1;
            else if (d.r < -1) d.r = -1;
            i[o] = d.l;
            c[o] = d.r;
            d.l = d.r = 0;
            d = d.next;
          }
        },
      },
    });
    e.bufferSize = 8192;
    return Object.seal(e);
  }
  function v(e) {
    var t = r();
    Object.defineProperties(t, {
      track: { value: null, writable: true },
      length: { value: 0, writable: true },
      restart: { value: 0, writable: true },
      timer: { value: 0, writable: true },
      master: { value: 0, writable: true },
      volume: {
        set: function (e) {
          if (e < 0) e = 0;
          else if (e > 1) e = 1;
          this.master = e * 64;
        },
      },
      setup: {
        configurable: false,
        value: function () {
          this.mixer.setup(this.channels);
        },
      },
    });
    t.mixer = e || d();
    t.mixer.player = t;
    t.endian = 1;
    t.quality = 1;
    return t;
  }
  window.neoart = Object.create(null);
  window.neoart.Unzip = 1;
  (function () {
    function t() {
      var t = Object.create(null, {
        player: { value: null, writable: true },
        index: { value: 0, writable: true },
        amiga: { value: null, writable: true },
        mixer: { value: null, writable: true },
        tracker: {
          get: function () {
            return this.player ? b[this.index + this.player.version] : b[0];
          },
        },
        load: {
          value: function (t) {
            var l, b, w;
            if (!t.view) t = e(t);
            t.endian = 1;
            t.position = 0;
            if (t.readUint() == 67324752) {
              if (window.neoart.Unzip) {
                l = i(t);
                t = l.uncompress(l.entries[0]);
              } else {
                throw "Unzip support is not available.";
              }
            }
            if (!t) return null;
            if (this.player && this.player.id != "STPlayer") {
              this.player.load(t);
              if (this.player.version) return player;
            }
            if (t.length > 336) {
              t.position = 38;
              b = t.readString(20);
              if (
                b == "FastTracker v2.00   " ||
                b == "FastTracker v 2.00  " ||
                b == "Sk@le Tracker" ||
                b == "MadTracker 2.0" ||
                b == "MilkyTracker        " ||
                b == "DigiBooster Pro 2.18" ||
                b.indexOf("OpenMPT") != -1
              ) {
                this.player = window.neoart.F2Player(this.mixer);
                this.player.load(t);
                if (this.player.version) {
                  this.index = y;
                  return this.player;
                }
              }
            }
            t.endian = 0;
            if (t.length > 2105) {
              t.position = 1080;
              b = t.readString(4);
              if (b == "M.K." || b == "FLT4") {
                this.player = window.neoart.MKPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = r;
                  return this.player;
                }
              } else if (b == "FEST") {
                this.player = window.neoart.HMPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = o;
                  return this.player;
                }
              }
            }
            if (t.length > 2105) {
              t.position = 1080;
              b = t.readString(4);
              if (b == "M.K." || b == "M!K!") {
                this.player = window.neoart.PTPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = s;
                  return this.player;
                }
              }
            }
            if (t.length > 1685) {
              t.position = 60;
              b = t.readString(4);
              if (b != "SONG") {
                t.position = 124;
                b = t.readString(4);
              }
              if (b == "SONG" || b == "SO31") {
                this.player = window.neoart.FXPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = u;
                  return this.player;
                }
              }
            }
            if (t.length > 4) {
              t.position = 0;
              b = t.readString(4);
              if (b == "ALL ") {
                this.player = window.neoart.D1Player(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = f;
                  return this.player;
                }
              }
            }
            if (t.length > 3018) {
              t.position = 3014;
              b = t.readString(4);
              if (b == ".FNL") {
                this.player = window.neoart.D2Player(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = f;
                  return this.player;
                }
              }
            }
            if (t.length > 30) {
              t.position = 26;
              b = t.readString(3);
              if (b == "BPS" || b == "V.2" || b == "V.3") {
                this.player = window.neoart.BPPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = a;
                  return this.player;
                }
              }
            }
            if (t.length > 4) {
              t.position = 0;
              b = t.readString(4);
              if (b == "SMOD" || b == "FC14") {
                this.player = window.neoart.FCPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = h;
                  return this.player;
                }
              }
            }
            if (t.length > 10) {
              t.position = 0;
              b = t.readString(9);
              if (b == " MUGICIAN") {
                this.player = window.neoart.DMPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = c;
                  return this.player;
                }
              }
            }
            if (t.length > 86) {
              t.position = 58;
              b = t.readString(28);
              if (b == "SIDMON II - THE MIDI VERSION") {
                this.player = window.neoart.S2Player(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = p;
                  return this.player;
                }
              }
            }
            if (t.length > 2830) {
              t.position = 0;
              w = t.readUshort();
              if (w == 20218) {
                this.player = window.neoart.FEPlayer(this.amiga);
                this.player.load(t);
                if (this.player.version) {
                  this.index = v;
                  return this.player;
                }
              }
            }
            if (t.length > 5220) {
              this.player = window.neoart.S1Player(this.amiga);
              this.player.load(t);
              if (this.player.version) {
                this.index = p;
                return this.player;
              }
            }
            t.position = 0;
            w = t.readUshort();
            t.position = 0;
            b = t.readString(4);
            if (
              b == "COSO" ||
              w == 24576 ||
              w == 24578 ||
              w == 24590 ||
              w == 24598
            ) {
              this.player = window.neoart.JHPlayer(this.amiga);
              this.player.load(t);
              if (this.player.version) {
                this.index = m;
                return this.player;
              }
            }
            t.position = 0;
            w = t.readUshort();
            this.player = window.neoart.DWPlayer(this.amiga);
            this.player.load(t);
            if (this.player.version) {
              this.index = d;
              return this.player;
            }
            t.position = 0;
            w = t.readUshort();
            if (w == 24576) {
              this.player = window.neoart.RHPlayer(this.amiga);
              this.player.load(t);
              if (this.player.version) {
                this.index = g;
                return this.player;
              }
            }
            if (t.length > 1625) {
              this.player = window.neoart.STPlayer(this.amiga);
              this.player.load(t);
              if (this.player.version) {
                this.index = n;
                return this.player;
              }
            }
            t.clear();
            this.index = 0;
            return (this.player = null);
          },
        },
      });
      t.amiga = l();
      return Object.seal(t);
    }
    var n = 0,
      r = 4,
      s = 9,
      o = 12,
      u = 13,
      a = 17,
      f = 20,
      c = 22,
      h = 24,
      p = 26,
      d = 28,
      v = 29,
      m = 30,
      g = 32,
      y = 33,
      b = [
        "Unknown Format",
        "Ultimate SoundTracker",
        "D.O.C. SoundTracker 9",
        "Master SoundTracker",
        "D.O.C. SoundTracker 2.0/2.2",
        "SoundTracker 2.3",
        "SoundTracker 2.4",
        "NoiseTracker 1.0",
        "NoiseTracker 1.1",
        "NoiseTracker 2.0",
        "ProTracker 1.0",
        "ProTracker 1.1/2.1",
        "ProTracker 1.2/2.0",
        "His Master's NoiseTracker",
        "SoundFX 1.0/1.7",
        "SoundFX 1.8",
        "SoundFX 1.945",
        "SoundFX 1.994/2.0",
        "BP SoundMon V1",
        "BP SoundMon V2",
        "BP SoundMon V3",
        "Delta Music 1.0",
        "Delta Music 2.0",
        "Digital Mugician",
        "Digital Mugician 7 Voices",
        "Future Composer 1.0/1.3",
        "Future Composer 1.4",
        "SidMon 1.0",
        "SidMon 2.0",
        "David Whittaker",
        "FredEd",
        "Jochen Hippel",
        "Jochen Hippel COSO",
        "Rob Hubbard",
        "FastTracker II",
        "Sk@leTracker",
        "MadTracker 2.0",
        "MilkyTracker",
        "DigiBooster Pro 2.18",
        "OpenMPT",
      ];
    window.neoart.FileLoader = t();
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        restart: { value: 0, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        sample: { value: 0, writable: true },
        samplePtr: { value: 0, writable: true },
        sampleLen: { value: 0, writable: true },
        synth: { value: 0, writable: true },
        synthPtr: { value: 0, writable: true },
        arpeggio: { value: 0, writable: true },
        autoArpeggio: { value: 0, writable: true },
        autoSlide: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        volumeDef: { value: 0, writable: true },
        adsrControl: { value: 0, writable: true },
        adsrPtr: { value: 0, writable: true },
        adsrCtr: { value: 0, writable: true },
        lfoControl: { value: 0, writable: true },
        lfoPtr: { value: 0, writable: true },
        lfoCtr: { value: 0, writable: true },
        egControl: { value: 0, writable: true },
        egPtr: { value: 0, writable: true },
        egCtr: { value: 0, writable: true },
        egValue: { value: 0, writable: true },
        fxControl: { value: 0, writable: true },
        fxCtr: { value: 0, writable: true },
        modControl: { value: 0, writable: true },
        modPtr: { value: 0, writable: true },
        modCtr: { value: 0, writable: true },
        initialize: {
          value: function () {
            (this.channel = null), (this.enabled = 0);
            this.restart = 0;
            this.note = 0;
            this.period = 0;
            this.sample = 0;
            this.samplePtr = 0;
            this.sampleLen = 2;
            this.synth = 0;
            this.synthPtr = -1;
            this.arpeggio = 0;
            this.autoArpeggio = 0;
            this.autoSlide = 0;
            this.vibrato = 0;
            this.volume = 0;
            this.volumeDef = 0;
            this.adsrControl = 0;
            this.adsrPtr = 0;
            this.adsrCtr = 0;
            this.lfoControl = 0;
            this.lfoPtr = 0;
            this.lfoCtr = 0;
            this.egControl = 0;
            this.egPtr = 0;
            this.egCtr = 0;
            this.egValue = 0;
            this.fxControl = 0;
            this.fxCtr = 0;
            this.modControl = 0;
            this.modPtr = 0;
            this.modCtr = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        synth: { value: 0, writable: true },
        table: { value: 0, writable: true },
        adsrControl: { value: 0, writable: true },
        adsrTable: { value: 0, writable: true },
        adsrLen: { value: 0, writable: true },
        adsrSpeed: { value: 0, writable: true },
        lfoControl: { value: 0, writable: true },
        lfoTable: { value: 0, writable: true },
        lfoDepth: { value: 0, writable: true },
        lfoLen: { value: 0, writable: true },
        lfoDelay: { value: 0, writable: true },
        lfoSpeed: { value: 0, writable: true },
        egControl: { value: 0, writable: true },
        egTable: { value: 0, writable: true },
        egLen: { value: 0, writable: true },
        egDelay: { value: 0, writable: true },
        egSpeed: { value: 0, writable: true },
        fxControl: { value: 0, writable: true },
        fxDelay: { value: 0, writable: true },
        fxSpeed: { value: 0, writable: true },
        modControl: { value: 0, writable: true },
        modTable: { value: 0, writable: true },
        modLen: { value: 0, writable: true },
        modDelay: { value: 0, writable: true },
        modSpeed: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function n() {
      var e = f();
      Object.defineProperties(e, {
        soundTranspose: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function r(r) {
      var a = c(r);
      Object.defineProperties(a, {
        id: { value: "BPPlayer" },
        tracks: { value: [], writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        buffer: { value: null, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        nextPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        repeatCtr: { value: 0, writable: true },
        arpeggioCtr: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t,
              n,
              r = this.voices[0];
            this.reset();
            this.speed = 6;
            this.tick = 1;
            this.trackPos = 0;
            this.patternPos = 0;
            this.nextPos = 0;
            this.jumpFlag = 0;
            this.repeatCtr = 0;
            this.arpeggioCtr = 1;
            this.vibratoPos = 0;
            for (e = 0; e < 128; ++e) this.buffer[e] = 0;
            while (r) {
              r.initialize();
              r.channel = this.mixer.channels[r.index];
              r.samplePtr = this.mixer.loopPtr;
              r = r.next;
            }
          },
        },
        restore: {
          value: function () {
            var e,
              t,
              n,
              r = this.voices[0];
            while (r) {
              if (r.synthPtr > -1) {
                n = r.index << 5;
                t = r.synthPtr + 32;
                for (e = r.synthPtr; e < t; ++e)
                  this.mixer.memory[e] = this.buffer[n++];
              }
              r = r.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var r = 0,
              a = 0,
              f,
              l,
              c,
              h,
              p,
              d;
            this.title = e.readString(26);
            f = e.readString(4);
            if (f == "BPSM") {
              this.version = i;
            } else {
              f = f.substr(0, 3);
              if (f == "V.2") this.version = s;
              else if (f == "V.3") this.version = o;
              else return;
              e.position = 29;
              d = e.readUbyte();
            }
            this.length = e.readUshort();
            for (; ++a < 16; ) {
              h = t();
              if (e.readUbyte() == 255) {
                h.synth = 1;
                h.table = e.readUbyte();
                h.pointer = h.table << 6;
                h.length = e.readUshort() << 1;
                h.adsrControl = e.readUbyte();
                h.adsrTable = e.readUbyte() << 6;
                h.adsrLen = e.readUshort();
                h.adsrSpeed = e.readUbyte();
                h.lfoControl = e.readUbyte();
                h.lfoTable = e.readUbyte() << 6;
                h.lfoDepth = e.readUbyte();
                h.lfoLen = e.readUshort();
                if (this.version < o) {
                  e.readByte();
                  h.lfoDelay = e.readUbyte();
                  h.lfoSpeed = e.readUbyte();
                  h.egControl = e.readUbyte();
                  h.egTable = e.readUbyte() << 6;
                  e.readByte();
                  h.egLen = e.readUshort();
                  e.readByte();
                  h.egDelay = e.readUbyte();
                  h.egSpeed = e.readUbyte();
                  h.fxSpeed = 1;
                  h.modSpeed = 1;
                  h.volume = e.readUbyte();
                  e.position += 6;
                } else {
                  h.lfoDelay = e.readUbyte();
                  h.lfoSpeed = e.readUbyte();
                  h.egControl = e.readUbyte();
                  h.egTable = e.readUbyte() << 6;
                  h.egLen = e.readUshort();
                  h.egDelay = e.readUbyte();
                  h.egSpeed = e.readUbyte();
                  h.fxControl = e.readUbyte();
                  h.fxSpeed = e.readUbyte();
                  h.fxDelay = e.readUbyte();
                  h.modControl = e.readUbyte();
                  h.modTable = e.readUbyte() << 6;
                  h.modSpeed = e.readUbyte();
                  h.modDelay = e.readUbyte();
                  h.volume = e.readUbyte();
                  h.modLen = e.readUshort();
                }
              } else {
                e.position--;
                h.synth = 0;
                h.name = e.readString(24);
                h.length = e.readUshort() << 1;
                if (h.length) {
                  h.loop = e.readUshort();
                  h.repeat = e.readUshort() << 1;
                  h.volume = e.readUshort();
                  if (h.loop + h.repeat >= h.length)
                    h.repeat = h.length - h.loop;
                } else {
                  h.pointer--;
                  h.repeat = 2;
                  e.position += 6;
                }
              }
              this.samples[a] = h;
            }
            l = this.length << 2;
            this.tracks.length = l;
            for (a = 0; a < l; ++a) {
              p = n();
              p.pattern = e.readUshort();
              p.soundTranspose = e.readByte();
              p.transpose = e.readByte();
              if (p.pattern > r) r = p.pattern;
              this.tracks[a] = p;
            }
            l = r << 4;
            this.patterns.length = l;
            for (a = 0; a < l; ++a) {
              c = u();
              c.note = e.readByte();
              c.sample = e.readUbyte();
              c.effect = c.sample & 15;
              c.sample = (c.sample & 240) >> 4;
              c.param = e.readByte();
              this.patterns[a] = c;
            }
            this.mixer.store(e, d << 6);
            for (a = 0; ++a < 16; ) {
              h = this.samples[a];
              if (h.synth || !h.length) continue;
              h.pointer = this.mixer.store(e, h.length);
              h.loopPtr = h.pointer + h.loop;
            }
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.mixer.memory,
              u,
              a,
              f,
              c,
              p,
              d,
              v = this.voices[0];
            this.arpeggioCtr = --this.arpeggioCtr & 3;
            this.vibratoPos = ++this.vibratoPos & 7;
            while (v) {
              e = v.channel;
              v.period += v.autoSlide;
              if (v.vibrato)
                e.period = v.period + ((h[this.vibratoPos] / v.vibrato) >> 0);
              else e.period = v.period;
              e.pointer = v.samplePtr;
              e.length = v.sampleLen;
              if (v.arpeggio || v.autoArpeggio) {
                u = v.note;
                if (!this.arpeggioCtr)
                  u +=
                    ((v.arpeggio & 240) >> 4) + ((v.autoArpeggio & 240) >> 4);
                else if (this.arpeggioCtr == 1)
                  u += (v.arpeggio & 15) + (v.autoArpeggio & 15);
                e.period = v.period = l[u + 35];
                v.restart = 0;
              }
              if (!v.synth || v.sample < 0) {
                v = v.next;
                continue;
              }
              c = this.samples[v.sample];
              if (v.adsrControl) {
                if (--v.adsrCtr == 0) {
                  v.adsrCtr = c.adsrSpeed;
                  t = (128 + s[c.adsrTable + v.adsrPtr]) >> 2;
                  e.volume = (t * v.volume) >> 6;
                  if (++v.adsrPtr == c.adsrLen) {
                    v.adsrPtr = 0;
                    if (v.adsrControl == 1) v.adsrControl = 0;
                  }
                }
              }
              if (v.lfoControl) {
                if (--v.lfoCtr == 0) {
                  v.lfoCtr = c.lfoSpeed;
                  t = s[c.lfoTable + v.lfoPtr];
                  if (c.lfoDepth) t = (t / c.lfoDepth) >> 0;
                  e.period = v.period + t;
                  if (++v.lfoPtr == c.lfoLen) {
                    v.lfoPtr = 0;
                    if (v.lfoControl == 1) v.lfoControl = 0;
                  }
                }
              }
              if (v.synthPtr < 0) {
                v = v.next;
                continue;
              }
              if (v.egControl) {
                if (--v.egCtr == 0) {
                  v.egCtr = c.egSpeed;
                  t = v.egValue;
                  v.egValue = (128 + s[c.egTable + v.egPtr]) >> 3;
                  if (v.egValue != t) {
                    p = (v.index << 5) + t;
                    n = v.synthPtr + t;
                    if (v.egValue < t) {
                      t -= v.egValue;
                      i = n - t;
                      for (; n > i; ) s[--n] = this.buffer[--p];
                    } else {
                      t = v.egValue - t;
                      i = n + t;
                      for (; n < i; ) s[n++] = ~this.buffer[p++] + 1;
                    }
                  }
                  if (++v.egPtr == c.egLen) {
                    v.egPtr = 0;
                    if (v.egControl == 1) v.egControl = 0;
                  }
                }
              }
              switch (v.fxControl) {
                case 0:
                  break;
                case 1:
                  if (--v.fxCtr == 0) {
                    v.fxCtr = c.fxSpeed;
                    n = v.synthPtr;
                    i = v.synthPtr + 32;
                    t = n > 0 ? s[n - 1] : 0;
                    for (; n < i; ) {
                      t = (t + s[n + 1]) >> 1;
                      s[n++] = t;
                    }
                  }
                  break;
                case 2:
                  p = (v.index << 5) + 31;
                  i = v.synthPtr + 32;
                  t = c.fxSpeed;
                  for (n = v.synthPtr; n < i; ++n) {
                    if (this.buffer[p] < s[n]) {
                      s[n] -= t;
                    } else if (this.buffer[p] > s[n]) {
                      s[n] += t;
                    }
                    p--;
                  }
                  break;
                case 3:
                case 5:
                  p = v.index << 5;
                  i = v.synthPtr + 32;
                  t = c.fxSpeed;
                  for (n = v.synthPtr; n < i; ++n) {
                    if (this.buffer[p] < s[n]) {
                      s[n] -= t;
                    } else if (this.buffer[p] > s[n]) {
                      s[n] += t;
                    }
                    p++;
                  }
                  break;
                case 4:
                  p = v.synthPtr + 64;
                  i = v.synthPtr + 32;
                  t = c.fxSpeed;
                  for (n = v.synthPtr; n < i; ++n) {
                    if (s[p] < s[n]) {
                      s[n] -= t;
                    } else if (s[p] > s[n]) {
                      s[n] += t;
                    }
                    p++;
                  }
                  break;
                case 6:
                  if (--v.fxCtr == 0) {
                    v.fxControl = 0;
                    v.fxCtr = 1;
                    p = v.synthPtr + 64;
                    i = v.synthPtr + 32;
                    for (n = v.synthPtr; n < i; ++n) s[n] = s[p++];
                  }
                  break;
              }
              if (v.modControl) {
                if (--v.modCtr == 0) {
                  v.modCtr = c.modSpeed;
                  s[v.synthPtr + 32] = s[c.modTable + v.modPtr];
                  if (++v.modPtr == c.modLen) {
                    v.modPtr = 0;
                    if (v.modControl == 1) v.modControl = 0;
                  }
                }
              }
              v = v.next;
            }
            if (--this.tick == 0) {
              this.tick = this.speed;
              v = this.voices[0];
              while (v) {
                e = v.channel;
                v.enabled = 0;
                d = this.tracks[(this.trackPos << 2) + v.index];
                f = this.patterns[this.patternPos + ((d.pattern - 1) << 4)];
                u = f.note;
                a = f.effect;
                t = f.param;
                if (u) {
                  v.autoArpeggio = v.autoSlide = v.vibrato = 0;
                  if (a != 10 || (t & 240) == 0) u += d.transpose;
                  v.note = u;
                  v.period = l[u + 35];
                  if (a < 13) v.restart = v.volumeDef = 1;
                  else v.restart = 0;
                  r = f.sample;
                  if (r == 0) r = v.sample;
                  if (a != 10 || (t & 15) == 0) r += d.soundTranspose;
                  if (a < 13 && (!v.synth || v.sample != r)) {
                    v.sample = r;
                    v.enabled = 1;
                  }
                }
                switch (a) {
                  case 0:
                    v.arpeggio = t;
                    break;
                  case 1:
                    v.volume = t;
                    v.volumeDef = 0;
                    if (this.version < o || !v.synth) e.volume = v.volume;
                    break;
                  case 2:
                    this.tick = this.speed = t;
                    break;
                  case 3:
                    this.mixer.filter.active = t;
                    break;
                  case 4:
                    v.period -= t;
                    v.arpeggio = 0;
                    break;
                  case 5:
                    v.period += t;
                    v.arpeggio = 0;
                    break;
                  case 6:
                    if (this.version == o) v.vibrato = t;
                    else this.repeatCtr = t;
                    break;
                  case 7:
                    if (this.version == o) {
                      this.nextPos = t;
                      this.jumpFlag = 1;
                    } else if (this.repeatCtr == 0) {
                      this.trackPos = t;
                    }
                    break;
                  case 8:
                    v.autoSlide = t;
                    break;
                  case 9:
                    v.autoArpeggio = t;
                    if (this.version == o) {
                      v.adsrPtr = 0;
                      if (v.adsrControl == 0) v.adsrControl = 1;
                    }
                    break;
                  case 11:
                    v.fxControl = t;
                    break;
                  case 13:
                    v.autoArpeggio = t;
                    v.fxControl ^= 1;
                    v.adsrPtr = 0;
                    if (v.adsrControl == 0) v.adsrControl = 1;
                    break;
                  case 14:
                    v.autoArpeggio = t;
                    v.adsrPtr = 0;
                    if (v.adsrControl == 0) v.adsrControl = 1;
                    break;
                  case 15:
                    v.autoArpeggio = t;
                    break;
                }
                v = v.next;
              }
              if (this.jumpFlag) {
                this.trackPos = this.nextPos;
                this.patternPos = this.jumpFlag = 0;
              } else if (++this.patternPos == 16) {
                this.patternPos = 0;
                if (++this.trackPos == this.length) {
                  this.trackPos = 0;
                  this.mixer.complete = 1;
                }
              }
              v = this.voices[0];
              while (v) {
                e = v.channel;
                if (v.enabled) e.enabled = v.enabled = 0;
                if (v.restart == 0) {
                  v = v.next;
                  continue;
                }
                if (v.synthPtr > -1) {
                  p = v.index << 5;
                  i = v.synthPtr + 32;
                  for (n = v.synthPtr; n < i; ++n) s[n] = this.buffer[p++];
                  v.synthPtr = -1;
                }
                v = v.next;
              }
              v = this.voices[0];
              while (v) {
                if (v.restart == 0 || v.sample < 0) {
                  v = v.next;
                  continue;
                }
                e = v.channel;
                e.period = v.period;
                v.restart = 0;
                c = this.samples[v.sample];
                if (c.synth) {
                  v.synth = 1;
                  v.egValue = 0;
                  v.adsrPtr = v.lfoPtr = v.egPtr = v.modPtr = 0;
                  v.adsrCtr = 1;
                  v.lfoCtr = c.lfoDelay + 1;
                  v.egCtr = c.egDelay + 1;
                  v.fxCtr = c.fxDelay + 1;
                  v.modCtr = c.modDelay + 1;
                  v.adsrControl = c.adsrControl;
                  v.lfoControl = c.lfoControl;
                  v.egControl = c.egControl;
                  v.fxControl = c.fxControl;
                  v.modControl = c.modControl;
                  e.pointer = v.samplePtr = c.pointer;
                  e.length = v.sampleLen = c.length;
                  if (v.adsrControl) {
                    t = (128 + s[c.adsrTable]) >> 2;
                    if (v.volumeDef) {
                      v.volume = c.volume;
                      v.volumeDef = 0;
                    }
                    e.volume = (t * v.volume) >> 6;
                  } else {
                    e.volume = v.volumeDef ? c.volume : v.volume;
                  }
                  if (v.egControl || v.fxControl || v.modControl) {
                    v.synthPtr = c.pointer;
                    n = v.index << 5;
                    i = v.synthPtr + 32;
                    for (p = v.synthPtr; p < i; ++p) this.buffer[n++] = s[p];
                  }
                } else {
                  v.synth = v.lfoControl = 0;
                  if (c.pointer < 0) {
                    v.samplePtr = this.mixer.loopPtr;
                    v.sampleLen = 2;
                  } else {
                    e.pointer = c.pointer;
                    e.volume = v.volumeDef ? c.volume : v.volume;
                    if (c.repeat != 2) {
                      v.samplePtr = c.loopPtr;
                      e.length = v.sampleLen = c.repeat;
                    } else {
                      v.samplePtr = this.mixer.loopPtr;
                      v.sampleLen = 2;
                      e.length = c.length;
                    }
                  }
                }
                e.enabled = v.enabled = 1;
                v = v.next;
              }
            }
          },
        },
      });
      a.voices[0] = e(0);
      a.voices[0].next = a.voices[1] = e(1);
      a.voices[1].next = a.voices[2] = e(2);
      a.voices[2].next = a.voices[3] = e(3);
      a.buffer = new Int8Array(128);
      return Object.seal(a);
    }
    var i = 1,
      s = 2,
      o = 3,
      l = [
        6848, 6464, 6080, 5760, 5440, 5120, 4832, 4576, 4320, 4064, 3840, 3616,
        3424, 3232, 3040, 2880, 2720, 2560, 2416, 2288, 2160, 2032, 1920, 1808,
        1712, 1616, 1520, 1440, 1360, 1280, 1208, 1144, 1080, 1016, 960, 904,
        856, 808, 760, 720, 680, 640, 604, 572, 540, 508, 480, 452, 428, 404,
        380, 360, 340, 320, 302, 286, 270, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 107, 101, 95, 90, 85, 80, 76,
        72, 68, 64, 60, 57,
      ],
      h = [0, 64, 128, 64, 0, -64, -128, -64];
    window.neoart.BPPlayer = r;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        status: { value: 0, writable: true },
        speed: { value: 0, writable: true },
        step: { value: null, writable: true },
        row: { value: null, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        arpeggioPos: { value: 0, writable: true },
        pitchBend: { value: 0, writable: true },
        tableCtr: { value: 0, writable: true },
        tablePos: { value: 0, writable: true },
        vibratoCtr: { value: 0, writable: true },
        vibratoDir: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoPeriod: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        attackCtr: { value: 0, writable: true },
        decayCtr: { value: 0, writable: true },
        releaseCtr: { value: 0, writable: true },
        sustain: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.sample = null;
            this.trackPos = 0;
            this.patternPos = 0;
            this.status = 0;
            this.speed = 1;
            this.step = null;
            this.row = null;
            this.note = 0;
            this.period = 0;
            this.arpeggioPos = 0;
            this.pitchBend = 0;
            this.tableCtr = 0;
            this.tablePos = 0;
            this.vibratoCtr = 0;
            this.vibratoDir = 0;
            this.vibratoPos = 0;
            this.vibratoPeriod = 0;
            this.volume = 0;
            this.attackCtr = 0;
            this.decayCtr = 0;
            this.releaseCtr = 0;
            this.sustain = 1;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        synth: { value: 0, writable: true },
        attackStep: { value: 0, writable: true },
        attackDelay: { value: 0, writable: true },
        decayStep: { value: 0, writable: true },
        decayDelay: { value: 0, writable: true },
        releaseStep: { value: 0, writable: true },
        releaseDelay: { value: 0, writable: true },
        sustain: { value: 0, writable: true },
        arpeggio: { value: null, writable: true },
        pitchBend: { value: 0, writable: true },
        portamento: { value: 0, writable: true },
        table: { value: null, writable: true },
        tableDelay: { value: 0, writable: true },
        vibratoWait: { value: 0, writable: true },
        vibratoStep: { value: 0, writable: true },
        vibratoLen: { value: 0, writable: true },
      });
      e.arpeggio = new Int8Array(8);
      e.table = new Int8Array(48);
      return Object.seal(e);
    }
    function n(n) {
      var i = c(n);
      Object.defineProperties(i, {
        id: { value: "D1Player" },
        pointers: { value: null, writable: true },
        tracks: { value: [], writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        voices: { value: [], writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.speed = 6;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[20];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var n,
              r = 0,
              i,
              s,
              o = 0,
              a,
              l,
              c,
              h,
              p,
              d;
            i = e.readString(4);
            if (i != "ALL ") return;
            l = 104;
            n = new Uint32Array(25);
            for (; r < 25; ++r) n[r] = e.readUint();
            this.pointers = new Uint32Array(4);
            for (r = 1; r < 4; ++r)
              this.pointers[r] = this.pointers[o] + (n[o++] >> 1) - 1;
            a = this.pointers[3] + (n[3] >> 1) - 1;
            this.tracks.length = a;
            s = l + n[1] - 2;
            e.position = l;
            o = 1;
            for (r = 0; r < a; ++r) {
              p = f();
              d = e.readUshort();
              if (d == 65535 || e.position == s) {
                p.pattern = -1;
                p.transpose = e.readUshort();
                s += n[o++];
              } else {
                e.position--;
                p.pattern = ((d >> 2) & 16320) >> 2;
                p.transpose = e.readByte();
              }
              this.tracks[r] = p;
            }
            a = n[4] >> 2;
            this.patterns.length = a;
            for (r = 0; r < a; ++r) {
              c = u();
              c.sample = e.readUbyte();
              c.note = e.readUbyte();
              c.effect = e.readUbyte() & 31;
              c.param = e.readUbyte();
              this.patterns[r] = c;
            }
            s = 5;
            for (r = 0; r < 20; ++r) {
              this.samples[r] = null;
              if (n[s] != 0) {
                h = t();
                h.attackStep = e.readUbyte();
                h.attackDelay = e.readUbyte();
                h.decayStep = e.readUbyte();
                h.decayDelay = e.readUbyte();
                h.sustain = e.readUshort();
                h.releaseStep = e.readUbyte();
                h.releaseDelay = e.readUbyte();
                h.volume = e.readUbyte();
                h.vibratoWait = e.readUbyte();
                h.vibratoStep = e.readUbyte();
                h.vibratoLen = e.readUbyte();
                h.pitchBend = e.readByte();
                h.portamento = e.readUbyte();
                h.synth = e.readUbyte();
                h.tableDelay = e.readUbyte();
                for (o = 0; o < 8; ++o) h.arpeggio[o] = e.readByte();
                h.length = e.readUshort();
                h.loop = e.readUshort();
                h.repeat = e.readUshort() << 1;
                h.synth = h.synth ? 0 : 1;
                if (h.synth) {
                  for (o = 0; o < 48; ++o) h.table[o] = e.readByte();
                  a = n[s] - 78;
                } else {
                  a = h.length;
                }
                h.pointer = this.mixer.store(e, a);
                h.loopPtr = h.pointer + h.loop;
                this.samples[r] = h;
              }
              s++;
            }
            h = t();
            h.pointer = h.loopPtr = this.mixer.memory.length;
            h.length = h.repeat = 2;
            this.samples[20] = h;
            this.version = 1;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              i,
              s,
              o,
              u = this.voices[0];
            while (u) {
              t = u.channel;
              if (--u.speed == 0) {
                u.speed = this.speed;
                if (u.patternPos == 0) {
                  u.step = this.tracks[this.pointers[u.index] + u.trackPos];
                  if (u.step.pattern < 0) {
                    u.trackPos = u.step.transpose;
                    u.step = this.tracks[this.pointers[u.index] + u.trackPos];
                  }
                  u.trackPos++;
                }
                i = this.patterns[u.step.pattern + u.patternPos];
                if (i.effect) u.row = i;
                if (i.note) {
                  t.enabled = 0;
                  u.row = i;
                  u.note = i.note + u.step.transpose;
                  u.arpeggioPos = u.pitchBend = u.status = 0;
                  s = u.sample = this.samples[i.sample];
                  if (!s.synth) t.pointer = s.pointer;
                  t.length = s.length;
                  u.tableCtr = u.tablePos = 0;
                  u.vibratoCtr = s.vibratoWait;
                  u.vibratoPos = s.vibratoLen;
                  u.vibratoDir = s.vibratoLen << 1;
                  u.volume = u.attackCtr = u.decayCtr = u.releaseCtr = 0;
                  u.sustain = s.sustain;
                }
                if (++u.patternPos == 16) u.patternPos = 0;
              }
              s = u.sample;
              if (s.synth) {
                if (u.tableCtr == 0) {
                  u.tableCtr = s.tableDelay;
                  do {
                    n = 1;
                    if (u.tablePos >= 48) u.tablePos = 0;
                    o = s.table[u.tablePos];
                    u.tablePos++;
                    if (o >= 0) {
                      t.pointer = s.pointer + (o << 5);
                      n = 0;
                    } else if (o != -1) {
                      s.tableDelay = o & 127;
                    } else {
                      u.tablePos = s.table[u.tablePos];
                    }
                  } while (n);
                } else u.tableCtr--;
              }
              if (s.portamento) {
                o = r[u.note] + u.pitchBend;
                if (u.period != 0) {
                  if (u.period < o) {
                    u.period += s.portamento;
                    if (u.period > o) u.period = o;
                  } else {
                    u.period -= s.portamento;
                    if (u.period < o) u.period = o;
                  }
                } else u.period = o;
              }
              if (u.vibratoCtr == 0) {
                u.vibratoPeriod = u.vibratoPos * s.vibratoStep;
                if ((u.status & 1) == 0) {
                  u.vibratoPos++;
                  if (u.vibratoPos == u.vibratoDir) u.status ^= 1;
                } else {
                  u.vibratoPos--;
                  if (u.vibratoPos == 0) u.status ^= 1;
                }
              } else {
                u.vibratoCtr--;
              }
              if (s.pitchBend < 0) u.pitchBend += s.pitchBend;
              else u.pitchBend -= s.pitchBend;
              if (u.row) {
                i = u.row;
                switch (i.effect) {
                  case 0:
                    break;
                  case 1:
                    o = i.param & 15;
                    if (o) this.speed = o;
                    break;
                  case 2:
                    u.pitchBend -= i.param;
                    break;
                  case 3:
                    u.pitchBend += i.param;
                    break;
                  case 4:
                    this.mixer.filter.active = i.param;
                    break;
                  case 5:
                    s.vibratoWait = i.param;
                    break;
                  case 6:
                    s.vibratoStep = i.param;
                  case 7:
                    s.vibratoLen = i.param;
                    break;
                  case 8:
                    s.pitchBend = i.param;
                    break;
                  case 9:
                    s.portamento = i.param;
                    break;
                  case 10:
                    o = i.param;
                    if (o > 64) o = 64;
                    s.volume = 64;
                    break;
                  case 11:
                    s.arpeggio[0] = i.param;
                    break;
                  case 12:
                    s.arpeggio[1] = i.param;
                    break;
                  case 13:
                    s.arpeggio[2] = i.param;
                    break;
                  case 14:
                    s.arpeggio[3] = i.param;
                    break;
                  case 15:
                    s.arpeggio[4] = i.param;
                    break;
                  case 16:
                    s.arpeggio[5] = i.param;
                    break;
                  case 17:
                    s.arpeggio[6] = i.param;
                    break;
                  case 18:
                    s.arpeggio[7] = i.param;
                    break;
                  case 19:
                    s.arpeggio[0] = s.arpeggio[4] = i.param;
                    break;
                  case 20:
                    s.arpeggio[1] = s.arpeggio[5] = i.param;
                    break;
                  case 21:
                    s.arpeggio[2] = s.arpeggio[6] = i.param;
                    break;
                  case 22:
                    s.arpeggio[3] = s.arpeggio[7] = i.param;
                    break;
                  case 23:
                    o = i.param;
                    if (o > 64) o = 64;
                    s.attackStep = o;
                    break;
                  case 24:
                    s.attackDelay = i.param;
                    break;
                  case 25:
                    o = i.param;
                    if (o > 64) o = 64;
                    s.decayStep = o;
                    break;
                  case 26:
                    s.decayDelay = i.param;
                    break;
                  case 27:
                    s.sustain = i.param & (s.sustain & 255);
                    break;
                  case 28:
                    s.sustain = (s.sustain & 65280) + i.param;
                    break;
                  case 29:
                    o = i.param;
                    if (o > 64) o = 64;
                    s.releaseStep = o;
                    break;
                  case 30:
                    s.releaseDelay = i.param;
                    break;
                }
              }
              if (s.portamento) o = u.period;
              else {
                o = r[u.note + s.arpeggio[u.arpeggioPos]];
                u.arpeggioPos = ++u.arpeggioPos & 7;
                o -= s.vibratoLen * s.vibratoStep;
                o += u.pitchBend;
                u.period = 0;
              }
              t.period = o + u.vibratoPeriod;
              e = u.status & 14;
              o = u.volume;
              if (e == 0) {
                if (u.attackCtr == 0) {
                  u.attackCtr = s.attackDelay;
                  o += s.attackStep;
                  if (o >= 64) {
                    e |= 2;
                    u.status |= 2;
                    o = 64;
                  }
                } else {
                  u.attackCtr--;
                }
              }
              if (e == 2) {
                if (u.decayCtr == 0) {
                  u.decayCtr = s.decayDelay;
                  o -= s.decayStep;
                  if (o <= s.volume) {
                    e |= 6;
                    u.status |= 6;
                    o = s.volume;
                  }
                } else {
                  u.decayCtr--;
                }
              }
              if (e == 6) {
                if (u.sustain == 0) {
                  e |= 14;
                  u.status |= 14;
                } else {
                  u.sustain--;
                }
              }
              if (e == 14) {
                if (u.releaseCtr == 0) {
                  u.releaseCtr = s.releaseDelay;
                  o -= s.releaseStep;
                  if (o < 0) {
                    u.status &= 9;
                    o = 0;
                  }
                } else {
                  u.releaseCtr--;
                }
              }
              t.volume = u.volume = o;
              t.enabled = 1;
              if (!s.synth) {
                if (s.loop) {
                  t.pointer = s.loopPtr;
                  t.length = s.repeat;
                } else {
                  t.pointer = this.mixer.loopPtr;
                  t.length = 2;
                }
              }
              u = u.next;
            }
          },
        },
      });
      i.voices[0] = e(0);
      i.voices[0].next = i.voices[1] = e(1);
      i.voices[1].next = i.voices[2] = e(2);
      i.voices[2].next = i.voices[3] = e(3);
      return Object.seal(i);
    }
    var r = [
      0, 6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3616,
      3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1808,
      1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 960, 904, 856, 808,
      762, 720, 678, 640, 604, 570, 538, 508, 480, 452, 428, 404, 381, 360, 339,
      320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143,
      135, 127, 120, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
      113,
    ];
    window.neoart.D1Player = n;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        trackPtr: { value: 0, writable: true },
        trackPos: { value: 0, writable: true },
        trackLen: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        restart: { value: 0, writable: true },
        step: { value: null, writable: true },
        row: { value: null, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        finalPeriod: { value: 0, writable: true },
        arpeggioPtr: { value: 0, writable: true },
        arpeggioPos: { value: 0, writable: true },
        pitchBend: { value: 0, writable: true },
        portamento: { value: 0, writable: true },
        tableCtr: { value: 0, writable: true },
        tablePos: { value: 0, writable: true },
        vibratoCtr: { value: 0, writable: true },
        vibratoDir: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoPeriod: { value: 0, writable: true },
        vibratoSustain: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        volumeMax: { value: 0, writable: true },
        volumePos: { value: 0, writable: true },
        volumeSustain: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.sample = null;
            this.trackPtr = 0;
            this.trackPos = 0;
            this.trackLen = 0;
            this.patternPos = 0;
            this.restart = 0;
            this.step = null;
            this.row = null;
            this.note = 0;
            this.period = 0;
            this.finalPeriod = 0;
            this.arpeggioPtr = 0;
            this.arpeggioPos = 0;
            this.pitchBend = 0;
            this.portamento = 0;
            this.tableCtr = 0;
            this.tablePos = 0;
            this.vibratoCtr = 0;
            this.vibratoDir = 0;
            this.vibratoPos = 0;
            this.vibratoPeriod = 0;
            this.vibratoSustain = 0;
            this.volume = 0;
            this.volumeMax = 63;
            this.volumePos = 0;
            this.volumeSustain = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        index: { value: 0, writable: true },
        pitchBend: { value: 0, writable: true },
        synth: { value: 0, writable: true },
        table: { value: null, writable: true },
        vibratos: { value: null, writable: true },
        volumes: { value: null, writable: true },
      });
      e.table = new Uint8Array(48);
      e.vibratos = new Uint8Array(15);
      e.volumes = new Uint8Array(15);
      return Object.seal(e);
    }
    function n(n) {
      var i = c(n);
      Object.defineProperties(i, {
        id: { value: "D2Player" },
        tracks: { value: [], writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        data: { value: null, writable: true },
        arpeggios: { value: null, writable: true },
        voices: { value: [], writable: true },
        noise: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.speed = 5;
            this.tick = 1;
            this.noise = 0;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[this.samples.length - 1];
              e.trackPtr = this.data[e.index];
              e.restart = this.data[e.index + 4];
              e.trackLen = this.data[e.index + 8];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var n = 0,
              r,
              i,
              s = 0,
              o,
              a,
              l,
              c,
              h,
              p;
            e.position = 3014;
            r = e.readString(4);
            if (r != ".FNL") return;
            e.position = 4042;
            this.data = new Uint16Array(12);
            for (; n < 4; ++n) {
              this.data[n + 4] = e.readUshort() >> 1;
              p = e.readUshort() >> 1;
              this.data[n + 8] = p;
              s += p;
            }
            p = s;
            for (n = 3; n > 0; --n) this.data[n] = p -= this.data[n + 8];
            this.tracks.length = s;
            for (n = 0; n < s; ++n) {
              h = f();
              h.pattern = e.readUbyte() << 4;
              h.transpose = e.readByte();
              this.tracks[n] = h;
            }
            s = e.readUint() >> 2;
            this.patterns.length = s;
            for (n = 0; n < s; ++n) {
              l = u();
              l.note = e.readUbyte();
              l.sample = e.readUbyte();
              l.effect = e.readUbyte() - 1;
              l.param = e.readUbyte();
              this.patterns[n] = l;
            }
            e.position += 254;
            p = e.readUshort();
            a = e.position;
            e.position -= 256;
            s = 1;
            o = new Uint16Array(128);
            for (n = 0; n < 128; ++n) {
              i = e.readUshort();
              if (i != p) o[s++] = i;
            }
            this.samples.length = s;
            for (n = 0; n < s; ++n) {
              e.position = a + o[n];
              c = t();
              c.length = e.readUshort() << 1;
              c.loop = e.readUshort();
              c.repeat = e.readUshort() << 1;
              for (i = 0; i < 15; ++i) c.volumes[i] = e.readUbyte();
              for (i = 0; i < 15; ++i) c.vibratos[i] = e.readUbyte();
              c.pitchBend = e.readUshort();
              c.synth = e.readByte();
              c.index = e.readUbyte();
              for (i = 0; i < 48; ++i) c.table[i] = e.readUbyte();
              this.samples[n] = c;
            }
            s = e.readUint();
            this.mixer.store(e, s);
            e.position += 64;
            for (n = 0; n < 8; ++n) o[n] = e.readUint();
            s = this.samples.length;
            a = e.position;
            for (n = 0; n < s; ++n) {
              c = this.samples[n];
              if (c.synth >= 0) continue;
              e.position = a + o[c.index];
              c.pointer = this.mixer.store(e, c.length);
              c.loopPtr = c.pointer + c.loop;
            }
            e.position = 3018;
            for (n = 0; n < 1024; ++n) this.arpeggios[n] = e.readByte();
            c = t();
            c.pointer = c.loopPtr = this.mixer.memory.length;
            c.length = c.repeat = 2;
            this.samples[s] = c;
            s = this.patterns.length;
            i = this.samples.length - 1;
            for (n = 0; n < s; ++n) {
              l = this.patterns[n];
              if (l.sample > i) l.sample = 0;
            }
            this.version = 2;
          },
        },
        process: {
          value: function () {
            var e,
              t = 0,
              n,
              i,
              s,
              o,
              u = this.voices[0];
            for (; t < 64; ) {
              this.noise = (this.noise << 7) | (this.noise >>> 25);
              this.noise += 1858762093;
              this.noise ^= 2656676139;
              o = (this.noise >>> 24) & 255;
              if (o > 127) o |= -256;
              this.mixer.memory[t++] = o;
              o = (this.noise >>> 16) & 255;
              if (o > 127) o |= -256;
              this.mixer.memory[t++] = o;
              o = (this.noise >>> 8) & 255;
              if (o > 127) o |= -256;
              this.mixer.memory[t++] = o;
              o = this.noise & 255;
              if (o > 127) o |= -256;
              this.mixer.memory[t++] = o;
            }
            if (--this.tick < 0) this.tick = this.speed;
            while (u) {
              if (u.trackLen < 1) {
                u = u.next;
                continue;
              }
              e = u.channel;
              s = u.sample;
              if (s.synth) {
                e.pointer = s.loopPtr;
                e.length = s.repeat;
              }
              if (this.tick == 0) {
                if (u.patternPos == 0) {
                  u.step = this.tracks[u.trackPtr + u.trackPos];
                  if (++u.trackPos == u.trackLen) u.trackPos = u.restart;
                }
                i = u.row = this.patterns[u.step.pattern + u.patternPos];
                if (i.note) {
                  e.enabled = 0;
                  u.note = i.note;
                  u.period = r[i.note + u.step.transpose];
                  s = u.sample = this.samples[i.sample];
                  if (s.synth < 0) {
                    e.pointer = s.pointer;
                    e.length = s.length;
                  }
                  u.arpeggioPos = 0;
                  u.tableCtr = 0;
                  u.tablePos = 0;
                  u.vibratoCtr = s.vibratos[1];
                  u.vibratoPos = 0;
                  u.vibratoDir = 0;
                  u.vibratoPeriod = 0;
                  u.vibratoSustain = s.vibratos[2];
                  u.volume = 0;
                  u.volumePos = 0;
                  u.volumeSustain = 0;
                }
                switch (i.effect) {
                  case -1:
                    break;
                  case 0:
                    this.speed = i.param & 15;
                    break;
                  case 1:
                    this.mixer.filter.active = i.param;
                    break;
                  case 2:
                    u.pitchBend = ~(i.param & 255) + 1;
                    break;
                  case 3:
                    u.pitchBend = i.param & 255;
                    break;
                  case 4:
                    u.portamento = i.param;
                    break;
                  case 5:
                    u.volumeMax = i.param & 63;
                    break;
                  case 6:
                    this.mixer.volume = i.param;
                    break;
                  case 7:
                    u.arpeggioPtr = (i.param & 63) << 4;
                    break;
                }
                u.patternPos = ++u.patternPos & 15;
              }
              s = u.sample;
              if (s.synth >= 0) {
                if (u.tableCtr) {
                  u.tableCtr--;
                } else {
                  u.tableCtr = s.index;
                  o = s.table[u.tablePos];
                  if (o == 255) {
                    o = s.table[++u.tablePos];
                    if (o != 255) {
                      u.tablePos = o;
                      o = s.table[u.tablePos];
                    }
                  }
                  if (o != 255) {
                    e.pointer = o << 8;
                    e.length = s.length;
                    if (++u.tablePos > 47) u.tablePos = 0;
                  }
                }
              }
              o = s.vibratos[u.vibratoPos];
              if (u.vibratoDir) u.vibratoPeriod -= o;
              else u.vibratoPeriod += o;
              if (--u.vibratoCtr == 0) {
                u.vibratoCtr = s.vibratos[u.vibratoPos + 1];
                u.vibratoDir = ~u.vibratoDir;
              }
              if (u.vibratoSustain) {
                u.vibratoSustain--;
              } else {
                u.vibratoPos += 3;
                if (u.vibratoPos == 15) u.vibratoPos = 12;
                u.vibratoSustain = s.vibratos[u.vibratoPos + 2];
              }
              if (u.volumeSustain) {
                u.volumeSustain--;
              } else {
                o = s.volumes[u.volumePos];
                n = s.volumes[u.volumePos + 1];
                if (n < u.volume) {
                  u.volume -= o;
                  if (u.volume < n) {
                    u.volume = n;
                    u.volumePos += 3;
                    u.volumeSustain = s.volumes[u.volumePos - 1];
                  }
                } else {
                  u.volume += o;
                  if (u.volume > n) {
                    u.volume = n;
                    u.volumePos += 3;
                    if (u.volumePos == 15) u.volumePos = 12;
                    u.volumeSustain = s.volumes[u.volumePos - 1];
                  }
                }
              }
              if (u.portamento) {
                if (u.period < u.finalPeriod) {
                  u.finalPeriod -= u.portamento;
                  if (u.finalPeriod < u.period) u.finalPeriod = u.period;
                } else {
                  u.finalPeriod += u.portamento;
                  if (u.finalPeriod > u.period) u.finalPeriod = u.period;
                }
              }
              o = this.arpeggios[u.arpeggioPtr + u.arpeggioPos];
              if (o == -128) {
                u.arpeggioPos = 0;
                o = this.arpeggios[u.arpeggioPtr];
              }
              u.arpeggioPos = ++u.arpeggioPos & 15;
              if (u.portamento == 0) {
                o = u.note + u.step.transpose + o;
                if (o < 0) o = 0;
                u.finalPeriod = r[o];
              }
              u.vibratoPeriod -= s.pitchBend - u.pitchBend;
              e.period = u.finalPeriod + u.vibratoPeriod;
              o = (u.volume >> 2) & 63;
              if (o > u.volumeMax) o = u.volumeMax;
              e.volume = o;
              e.enabled = 1;
              u = u.next;
            }
          },
        },
      });
      i.voices[0] = e(0);
      i.voices[0].next = i.voices[1] = e(1);
      i.voices[1].next = i.voices[2] = e(2);
      i.voices[2].next = i.voices[3] = e(3);
      i.arpeggios = new Int8Array(1024);
      return Object.seal(i);
    }
    var r = [
      0, 6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3616,
      3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1808,
      1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 904, 856,
      808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 452, 428, 404, 381, 360,
      339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151,
      143, 135, 127, 120, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
      113, 113,
    ];
    window.neoart.D2Player = n;
  })();
  (function () {
    function e() {
      return Object.create(null, {
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        step: { value: null, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        val1: { value: 0, writable: true },
        val2: { value: 0, writable: true },
        finalPeriod: { value: 0, writable: true },
        arpeggioStep: { value: 0, writable: true },
        effectCtr: { value: 0, writable: true },
        pitch: { value: 0, writable: true },
        pitchCtr: { value: 0, writable: true },
        pitchStep: { value: 0, writable: true },
        portamento: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        volumeCtr: { value: 0, writable: true },
        volumeStep: { value: 0, writable: true },
        mixMute: { value: 0, writable: true },
        mixPtr: { value: 0, writable: true },
        mixEnd: { value: 0, writable: true },
        mixSpeed: { value: 0, writable: true },
        mixStep: { value: 0, writable: true },
        mixVolume: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.sample = null;
            this.step = null;
            this.note = 0;
            this.period = 0;
            this.val1 = 0;
            this.val2 = 0;
            this.finalPeriod = 0;
            this.arpeggioStep = 0;
            this.effectCtr = 0;
            this.pitch = 0;
            this.pitchCtr = 0;
            this.pitchStep = 0;
            this.portamento = 0;
            this.volume = 0;
            this.volumeCtr = 0;
            this.volumeStep = 0;
            this.mixMute = 1;
            this.mixPtr = 0;
            this.mixEnd = 0;
            this.mixSpeed = 0;
            this.mixStep = 0;
            this.mixVolume = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        wave: { value: 0, writable: true },
        waveLen: { value: 0, writable: true },
        finetune: { value: 0, writable: true },
        arpeggio: { value: 0, writable: true },
        pitch: { value: 0, writable: true },
        pitchDelay: { value: 0, writable: true },
        pitchLoop: { value: 0, writable: true },
        pitchSpeed: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        effectDone: { value: 0, writable: true },
        effectStep: { value: 0, writable: true },
        effectSpeed: { value: 0, writable: true },
        source1: { value: 0, writable: true },
        source2: { value: 0, writable: true },
        volumeLoop: { value: 0, writable: true },
        volumeSpeed: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function n() {
      return Object.create(null, {
        title: { value: "", writable: true },
        speed: { value: 0, writable: true },
        length: { value: 0, writable: true },
        loop: { value: 0, writable: true },
        loopStep: { value: 0, writable: true },
        tracks: { value: [], writable: true },
      });
    }
    function r(r) {
      var a = c(r);
      Object.defineProperties(a, {
        id: { value: "DMPlayer" },
        songs: { value: [], writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        voices: { value: [], writable: true },
        buffer1: { value: 0, writable: true },
        buffer2: { value: 0, writable: true },
        song1: { value: 0, writable: true },
        song2: { value: 0, writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        patternLen: { value: 0, writable: true },
        patternEnd: { value: 0, writable: true },
        stepEnd: { value: 0, writable: true },
        numChannels: { value: 0, writable: true },
        arpeggios: { value: null, writable: true },
        averages: { value: null, writable: true },
        volumes: { value: null, writable: true },
        mixChannel: { value: null, writable: true },
        mixPeriod: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t = 0,
              n,
              r;
            this.reset();
            if (this.playSong > 7) this.playSong = 0;
            this.song1 = this.songs[this.playSong];
            this.speed = this.song1.speed & 15;
            this.speed |= this.speed << 4;
            this.tick = this.song1.speed;
            this.trackPos = 0;
            this.patternPos = 0;
            this.patternLen = 64;
            this.patternEnd = 1;
            this.stepEnd = 1;
            this.numChannels = 4;
            for (; t < 7; ++t) {
              r = this.voices[t];
              r.initialize();
              r.sample = this.samples[0];
              if (t < 4) {
                e = this.mixer.channels[t];
                e.enabled = 0;
                e.pointer = this.mixer.loopPtr;
                e.length = 2;
                e.period = 124;
                e.volume = 0;
                r.channel = e;
              }
            }
            if (this.version == o) {
              if ((this.playSong & 1) != 0) this.playSong--;
              this.song2 = this.songs[this.playSong + 1];
              this.mixChannel = s(7);
              this.numChannels = 7;
              e = this.mixer.channels[3];
              e.mute = 0;
              e.pointer = this.buffer1;
              e.length = 350;
              e.period = this.mixPeriod;
              e.volume = 64;
              n = this.buffer1 + 700;
              for (t = this.buffer1; t < n; ++t) this.mixer.memory[t] = 0;
            }
          },
        },
        loader: {
          value: function (e) {
            var r,
              s = 0,
              a,
              l,
              c,
              h,
              p,
              d,
              v,
              m,
              g,
              y;
            a = e.readString(24);
            if (a == " MUGICIAN/SOFTEYES 1990 ") this.version = i;
            else if (a == " MUGICIAN2/SOFTEYES 1990") this.version = o;
            else return;
            e.position = 28;
            l = new Uint32Array(8);
            for (; s < 8; ++s) l[s] = e.readUint();
            e.position = 76;
            for (s = 0; s < 8; ++s) {
              g = n();
              g.loop = e.readUbyte();
              g.loopStep = e.readUbyte() << 2;
              g.speed = e.readUbyte();
              g.length = e.readUbyte() << 2;
              g.title = e.readString(12);
              this.songs[s] = g;
            }
            e.position = 204;
            this.lastSong = this.songs.length - 1;
            for (s = 0; s < 8; ++s) {
              g = this.songs[s];
              p = l[s] << 2;
              for (h = 0; h < p; ++h) {
                y = f();
                y.pattern = e.readUbyte() << 6;
                y.transpose = e.readByte();
                g.tracks[h] = y;
              }
            }
            d = e.position;
            e.position = 60;
            p = e.readUint();
            this.samples.length = ++p;
            e.position = d;
            for (s = 1; s < p; ++s) {
              m = t();
              m.wave = e.readUbyte();
              m.waveLen = e.readUbyte() << 1;
              m.volume = e.readUbyte();
              m.volumeSpeed = e.readUbyte();
              m.arpeggio = e.readUbyte();
              m.pitch = e.readUbyte();
              m.effectStep = e.readUbyte();
              m.pitchDelay = e.readUbyte();
              m.finetune = e.readUbyte() << 6;
              m.pitchLoop = e.readUbyte();
              m.pitchSpeed = e.readUbyte();
              m.effect = e.readUbyte();
              m.source1 = e.readUbyte();
              m.source2 = e.readUbyte();
              m.effectSpeed = e.readUbyte();
              m.volumeLoop = e.readUbyte();
              this.samples[s] = m;
            }
            this.samples[0] = this.samples[1];
            d = e.position;
            e.position = 64;
            p = e.readUint() << 7;
            e.position = d;
            this.mixer.store(e, p);
            d = e.position;
            e.position = 68;
            c = e.readUint();
            e.position = 26;
            p = e.readUshort() << 6;
            this.patterns.length = p;
            e.position = d + (c << 5);
            if (c) c = d;
            for (s = 0; s < p; ++s) {
              v = u();
              v.note = e.readUbyte();
              v.sample = e.readUbyte() & 63;
              v.effect = e.readUbyte();
              v.param = e.readByte();
              this.patterns[s] = v;
            }
            d = e.position;
            e.position = 72;
            if (c) {
              p = e.readUint();
              e.position = d;
              r = this.mixer.store(e, p);
              d = e.position;
              this.mixer.memory.length += 350;
              this.buffer1 = this.mixer.memory.length;
              this.mixer.memory.length += 350;
              this.buffer2 = this.mixer.memory.length;
              this.mixer.memory.length += 350;
              this.mixer.loopLen = 8;
              p = this.samples.length;
              for (s = 1; s < p; ++s) {
                m = this.samples[s];
                if (m.wave < 32) continue;
                e.position = c + ((m.wave - 32) << 5);
                m.pointer = e.readUint();
                m.length = e.readUint() - m.pointer;
                m.loop = e.readUint();
                m.name = e.readString(12);
                if (m.loop) {
                  m.loop -= m.pointer;
                  m.repeat = m.length - m.loop;
                  if ((m.repeat & 1) != 0) m.repeat--;
                } else {
                  m.loopPtr = this.mixer.memory.length;
                  m.repeat = 8;
                }
                if ((m.pointer & 1) != 0) m.pointer--;
                if ((m.length & 1) != 0) m.length--;
                m.pointer += r;
                if (!m.loopPtr) m.loopPtr = m.pointer + m.loop;
              }
            } else {
              d += e.readUint();
            }
            e.position = 24;
            if (e.readUshort() == 1) {
              e.position = d;
              p = e.length - e.position;
              if (p > 256) p = 256;
              for (s = 0; s < p; ++s) this.arpeggios[s] = e.readUbyte();
            }
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n = 0,
              r,
              i,
              s,
              o = this.mixer.memory,
              u,
              a,
              f,
              c,
              h,
              p,
              d;
            for (; n < this.numChannels; ++n) {
              d = this.voices[n];
              h = d.sample;
              if (n < 3 || this.numChannels == 4) {
                e = d.channel;
                if (this.stepEnd) d.step = this.song1.tracks[this.trackPos + n];
                if (h.wave > 31) {
                  e.pointer = h.loopPtr;
                  e.length = h.repeat;
                }
              } else {
                e = this.mixChannel;
                if (this.stepEnd)
                  d.step = this.song2.tracks[this.trackPos + (n - 3)];
              }
              if (this.patternEnd) {
                a = this.patterns[d.step.pattern + this.patternPos];
                if (a.note) {
                  if (a.effect != 74) {
                    d.note = a.note;
                    if (a.sample) h = d.sample = this.samples[a.sample];
                  }
                  d.val1 = a.effect < 64 ? 1 : a.effect - 62;
                  d.val2 = a.param;
                  r = d.step.transpose + h.finetune;
                  if (d.val1 != 12) {
                    d.pitch = a.effect;
                    if (d.val1 == 1) {
                      r += d.pitch;
                      if (r < 0) d.period = 0;
                      else d.period = l[r];
                    }
                  } else {
                    d.pitch = a.note;
                    r += d.pitch;
                    if (r < 0) d.period = 0;
                    else d.period = l[r];
                  }
                  if (d.val1 == 11) h.arpeggio = d.val2 & 7;
                  if (d.val1 != 12) {
                    if (h.wave > 31) {
                      e.pointer = h.pointer;
                      e.length = h.length;
                      e.enabled = 0;
                      d.mixPtr = h.pointer;
                      d.mixEnd = h.pointer + h.length;
                      d.mixMute = 0;
                    } else {
                      t = h.wave << 7;
                      e.pointer = t;
                      e.length = h.waveLen;
                      if (d.val1 != 10) e.enabled = 0;
                      if (this.numChannels == 4) {
                        if (h.effect != 0 && d.val1 != 2 && d.val1 != 4) {
                          s = t + 128;
                          f = h.source1 << 7;
                          for (i = t; i < s; ++i) o[i] = o[f++];
                          h.effectStep = 0;
                          d.effectCtr = h.effectSpeed;
                        }
                      }
                    }
                  }
                  if (d.val1 != 3 && d.val1 != 4 && d.val1 != 12) {
                    d.volumeCtr = 1;
                    d.volumeStep = 0;
                  }
                  d.arpeggioStep = 0;
                  d.pitchCtr = h.pitchDelay;
                  d.pitchStep = 0;
                  d.portamento = 0;
                }
              }
              switch (d.val1) {
                case 0:
                  break;
                case 5:
                  p = d.val2;
                  if (p > 0 && p < 65) this.patternLen = p;
                  break;
                case 6:
                  p = d.val2 & 15;
                  p |= p << 4;
                  if (d.val2 == 0 || d.val2 > 15) break;
                  this.speed = p;
                  break;
                case 7:
                  this.mixer.filter.active = 1;
                  break;
                case 8:
                  this.mixer.filter.active = 0;
                  break;
                case 13:
                  d.val1 = 0;
                  p = d.val2 & 15;
                  if (p == 0) break;
                  p = d.val2 & 240;
                  if (p == 0) break;
                  this.speed = d.val2;
                  break;
              }
            }
            for (n = 0; n < this.numChannels; ++n) {
              d = this.voices[n];
              h = d.sample;
              if (this.numChannels == 4) {
                e = d.channel;
                if (h.wave < 32 && h.effect && !h.effectDone) {
                  h.effectDone = 1;
                  if (d.effectCtr) {
                    d.effectCtr--;
                  } else {
                    d.effectCtr = h.effectSpeed;
                    t = h.wave << 7;
                    switch (h.effect) {
                      case 1:
                        for (i = 0; i < 127; ++i) {
                          p = o[t];
                          p += o[t + 1];
                          o[t++] = p >> 1;
                        }
                        break;
                      case 2:
                        f = h.source1 << 7;
                        c = h.source2 << 7;
                        r = h.effectStep;
                        s = h.waveLen;
                        h.effectStep = ++h.effectStep & 127;
                        for (i = 0; i < s; ++i) {
                          p = o[f++];
                          p += o[c + r];
                          o[t++] = p >> 1;
                          r = ++r & 127;
                        }
                        break;
                      case 3:
                        p = o[t];
                        for (i = 0; i < 127; ++i) o[t] = o[++t];
                        o[t] = p;
                        break;
                      case 4:
                        t += 127;
                        p = o[t];
                        for (i = 0; i < 127; ++i) o[t] = o[--t];
                        o[t] = p;
                        break;
                      case 5:
                        r = p = t;
                        for (i = 0; i < 64; ++i) {
                          o[r++] = o[t++];
                          t++;
                        }
                        r = t = p;
                        r += 64;
                        for (i = 0; i < 64; ++i) o[r++] = o[t++];
                        break;
                      case 6:
                        f = t + 64;
                        t += 128;
                        for (i = 0; i < 64; ++i) {
                          o[--t] = o[--f];
                          o[--t] = o[f];
                        }
                        break;
                      case 7:
                        t += h.effectStep;
                        o[t] = ~o[t] + 1;
                        if (++h.effectStep >= h.waveLen) h.effectStep = 0;
                        break;
                      case 8:
                        h.effectStep = ++h.effectStep & 127;
                        c = (h.source2 << 7) + h.effectStep;
                        r = o[c];
                        s = h.waveLen;
                        p = 3;
                        for (i = 0; i < s; ++i) {
                          f = o[t] + p;
                          if (f < -128) f += 256;
                          else if (f > 127) f -= 256;
                          o[t++] = f;
                          p += r;
                          if (p < -128) p += 256;
                          else if (p > 127) p -= 256;
                        }
                        break;
                      case 9:
                        c = h.source2 << 7;
                        s = h.waveLen;
                        for (i = 0; i < s; ++i) {
                          p = o[c++];
                          p += o[t];
                          if (p > 127) p -= 256;
                          o[t++] = p;
                        }
                        break;
                      case 10:
                        for (i = 0; i < 126; ++i) {
                          p = o[t++] * 3;
                          p += o[t + 1];
                          o[t] = p >> 2;
                        }
                        break;
                      case 11:
                        f = h.source1 << 7;
                        c = h.source2 << 7;
                        s = h.waveLen;
                        h.effectStep = ++h.effectStep & 127;
                        p = h.effectStep;
                        if (p >= 64) p = 127 - p;
                        r = (p ^ 255) & 63;
                        for (i = 0; i < s; ++i) {
                          u = o[f++] * p;
                          u += o[c++] * r;
                          o[t++] = u >> 6;
                        }
                        break;
                      case 12:
                        f = h.source1 << 7;
                        c = h.source2 << 7;
                        s = h.waveLen;
                        h.effectStep = ++h.effectStep & 31;
                        p = h.effectStep;
                        if (p >= 16) p = 31 - p;
                        r = (p ^ 255) & 15;
                        for (i = 0; i < s; ++i) {
                          u = o[f++] * p;
                          u += o[c++] * r;
                          o[t++] = u >> 4;
                        }
                        break;
                      case 13:
                        for (i = 0; i < 126; ++i) {
                          p = o[t++];
                          p += o[t + 1];
                          o[t] = p >> 1;
                        }
                        break;
                      case 14:
                        r = t + h.effectStep;
                        o[r] = ~o[r] + 1;
                        r = (h.effectStep + h.source2) & (h.waveLen - 1);
                        r += t;
                        o[r] = ~o[r] + 1;
                        if (++h.effectStep >= h.waveLen) h.effectStep = 0;
                        break;
                      case 15:
                        r = t;
                        for (i = 0; i < 127; ++i) {
                          p = o[t];
                          p += o[t + 1];
                          o[t++] = p >> 1;
                        }
                        t = r;
                        h.effectStep++;
                        if (h.effectStep == h.source2) {
                          h.effectStep = 0;
                          r = p = t;
                          for (i = 0; i < 64; ++i) {
                            o[r++] = o[t++];
                            t++;
                          }
                          r = t = p;
                          r += 64;
                          for (i = 0; i < 64; ++i) o[r++] = o[t++];
                        }
                        break;
                    }
                  }
                }
              } else {
                e = n < 3 ? d.channel : this.mixChannel;
              }
              if (d.volumeCtr) {
                d.volumeCtr--;
                if (d.volumeCtr == 0) {
                  d.volumeCtr = h.volumeSpeed;
                  d.volumeStep = ++d.volumeStep & 127;
                  if (d.volumeStep || h.volumeLoop) {
                    r = d.volumeStep + (h.volume << 7);
                    p = ~(o[r] + 129) + 1;
                    d.volume = (p & 255) >> 2;
                    e.volume = d.volume;
                  } else {
                    d.volumeCtr = 0;
                  }
                }
              }
              p = d.note;
              if (h.arpeggio) {
                r = d.arpeggioStep + (h.arpeggio << 5);
                p += this.arpeggios[r];
                d.arpeggioStep = ++d.arpeggioStep & 31;
              }
              r = p + d.step.transpose + h.finetune;
              d.finalPeriod = l[r];
              t = d.finalPeriod;
              if (d.val1 == 1 || d.val1 == 12) {
                p = ~d.val2 + 1;
                d.portamento += p;
                d.finalPeriod += d.portamento;
                if (d.val2) {
                  if (
                    (p < 0 && d.finalPeriod <= d.period) ||
                    (p >= 0 && d.finalPeriod >= d.period)
                  ) {
                    d.portamento = d.period - t;
                    d.val2 = 0;
                  }
                }
              }
              if (h.pitch) {
                if (d.pitchCtr) {
                  d.pitchCtr--;
                } else {
                  r = d.pitchStep;
                  d.pitchStep = ++d.pitchStep & 127;
                  if (d.pitchStep == 0) d.pitchStep = h.pitchLoop;
                  r += h.pitch << 7;
                  p = o[r];
                  d.finalPeriod += ~p + 1;
                }
              }
              e.period = d.finalPeriod;
            }
            if (this.numChannels > 4) {
              f = this.buffer1;
              this.buffer1 = this.buffer2;
              this.buffer2 = f;
              e = this.mixer.channels[3];
              e.pointer = f;
              for (n = 3; n < 7; ++n) {
                d = this.voices[n];
                d.mixStep = 0;
                if (d.finalPeriod < 125) {
                  d.mixMute = 1;
                  d.mixSpeed = 0;
                } else {
                  i = ((d.finalPeriod << 8) / this.mixPeriod) & 65535;
                  c = ((256 / i) & 255) << 8;
                  t = (256 % i << 8) & 16777215;
                  d.mixSpeed = (c | ((t / i) & 255)) << 8;
                }
                if (d.mixMute) d.mixVolume = 0;
                else d.mixVolume = d.volume << 8;
              }
              for (n = 0; n < 350; ++n) {
                t = 0;
                for (i = 3; i < 7; ++i) {
                  d = this.voices[i];
                  c = (o[d.mixPtr + (d.mixStep >> 16)] & 255) + d.mixVolume;
                  t += this.volumes[c];
                  d.mixStep += d.mixSpeed;
                }
                o[f++] = this.averages[t];
              }
              e.length = 350;
              e.period = this.mixPeriod;
              e.volume = 64;
            }
            if (--this.tick == 0) {
              this.tick = this.speed & 15;
              this.speed = (this.speed & 240) >> 4;
              this.speed |= this.tick << 4;
              this.patternEnd = 1;
              this.patternPos++;
              if (this.patternPos == 64 || this.patternPos == this.patternLen) {
                this.patternPos = 0;
                this.stepEnd = 1;
                this.trackPos += 4;
                if (this.trackPos == this.song1.length) {
                  this.trackPos = this.song1.loopStep;
                  this.mixer.complete = 1;
                }
              }
            } else {
              this.patternEnd = 0;
              this.stepEnd = 0;
            }
            for (n = 0; n < this.numChannels; ++n) {
              d = this.voices[n];
              d.mixPtr += d.mixStep >> 16;
              h = d.sample;
              h.effectDone = 0;
              if (d.mixPtr >= d.mixEnd) {
                if (h.loop) {
                  d.mixPtr -= h.repeat;
                } else {
                  d.mixPtr = 0;
                  d.mixMute = 1;
                }
              }
              if (n < 4) {
                e = d.channel;
                e.enabled = 1;
              }
            }
          },
        },
        tables: {
          value: function () {
            var e = 0,
              t,
              n,
              r = 0,
              i = 0,
              s,
              o,
              u = 128;
            this.averages = new Int32Array(1024);
            this.volumes = new Int32Array(16384);
            this.mixPeriod = 203;
            for (; e < 1024; ++e) {
              if (u > 127) u -= 256;
              this.averages[e] = u;
              if (e > 383 && e < 639) u = ++u & 255;
            }
            for (e = 0; e < 64; ++e) {
              s = -128;
              o = 128;
              for (n = 0; n < 256; ++n) {
                u = (s * i) / 63 + 128;
                t = r + o;
                this.volumes[t] = u & 255;
                if (e != 0 && e != 63 && o >= 128) --this.volumes[t];
                s++;
                o = ++o & 255;
              }
              r += 256;
              i++;
            }
          },
        },
      });
      a.voices[0] = e();
      a.voices[1] = e();
      a.voices[2] = e();
      a.voices[3] = e();
      a.voices[4] = e();
      a.voices[5] = e();
      a.voices[6] = e();
      a.arpeggios = new Uint8Array(256);
      a.tables();
      return Object.seal(a);
    }
    var i = 1,
      o = 2,
      l = [
        3220, 3040, 2869, 2708, 2556, 2412, 2277, 2149, 2029, 1915, 1807, 1706,
        1610, 1520, 1434, 1354, 1278, 1206, 1139, 1075, 1014, 957, 904, 853,
        805, 760, 717, 677, 639, 603, 569, 537, 507, 479, 452, 426, 403, 380,
        359, 338, 319, 302, 285, 269, 254, 239, 226, 213, 201, 190, 179, 169,
        160, 151, 142, 134, 127, 4842, 4571, 4314, 4072, 3843, 3628, 3424, 3232,
        3051, 2879, 2718, 2565, 2421, 2285, 2157, 2036, 1922, 1814, 1712, 1616,
        1525, 1440, 1359, 1283, 1211, 1143, 1079, 1018, 961, 907, 856, 808, 763,
        720, 679, 641, 605, 571, 539, 509, 480, 453, 428, 404, 381, 360, 340,
        321, 303, 286, 270, 254, 240, 227, 214, 202, 191, 180, 170, 160, 151,
        143, 135, 127, 4860, 4587, 4330, 4087, 3857, 3641, 3437, 3244, 3062,
        2890, 2728, 2574, 2430, 2294, 2165, 2043, 1929, 1820, 1718, 1622, 1531,
        1445, 1364, 1287, 1215, 1147, 1082, 1022, 964, 910, 859, 811, 765, 722,
        682, 644, 607, 573, 541, 511, 482, 455, 430, 405, 383, 361, 341, 322,
        304, 287, 271, 255, 241, 228, 215, 203, 191, 181, 170, 161, 152, 143,
        135, 128, 4878, 4604, 4345, 4102, 3871, 3654, 3449, 3255, 3073, 2900,
        2737, 2584, 2439, 2302, 2173, 2051, 1936, 1827, 1724, 1628, 1536, 1450,
        1369, 1292, 1219, 1151, 1086, 1025, 968, 914, 862, 814, 768, 725, 684,
        646, 610, 575, 543, 513, 484, 457, 431, 407, 384, 363, 342, 323, 305,
        288, 272, 256, 242, 228, 216, 203, 192, 181, 171, 161, 152, 144, 136,
        128, 4895, 4620, 4361, 4116, 3885, 3667, 3461, 3267, 3084, 2911, 2747,
        2593, 2448, 2310, 2181, 2058, 1943, 1834, 1731, 1634, 1542, 1455, 1374,
        1297, 1224, 1155, 1090, 1029, 971, 917, 865, 817, 771, 728, 687, 648,
        612, 578, 545, 515, 486, 458, 433, 408, 385, 364, 343, 324, 306, 289,
        273, 257, 243, 229, 216, 204, 193, 182, 172, 162, 153, 144, 136, 129,
        4913, 4637, 4377, 4131, 3899, 3681, 3474, 3279, 3095, 2921, 2757, 2603,
        2456, 2319, 2188, 2066, 1950, 1840, 1737, 1639, 1547, 1461, 1379, 1301,
        1228, 1159, 1094, 1033, 975, 920, 868, 820, 774, 730, 689, 651, 614,
        580, 547, 516, 487, 460, 434, 410, 387, 365, 345, 325, 307, 290, 274,
        258, 244, 230, 217, 205, 193, 183, 172, 163, 154, 145, 137, 129, 4931,
        4654, 4393, 4146, 3913, 3694, 3486, 3291, 3106, 2932, 2767, 2612, 2465,
        2327, 2196, 2073, 1957, 1847, 1743, 1645, 1553, 1466, 1384, 1306, 1233,
        1163, 1098, 1037, 978, 923, 872, 823, 777, 733, 692, 653, 616, 582, 549,
        518, 489, 462, 436, 411, 388, 366, 346, 326, 308, 291, 275, 259, 245,
        231, 218, 206, 194, 183, 173, 163, 154, 145, 137, 130, 4948, 4671, 4409,
        4161, 3928, 3707, 3499, 3303, 3117, 2942, 2777, 2621, 2474, 2335, 2204,
        2081, 1964, 1854, 1750, 1651, 1559, 1471, 1389, 1311, 1237, 1168, 1102,
        1040, 982, 927, 875, 826, 779, 736, 694, 655, 619, 584, 551, 520, 491,
        463, 437, 413, 390, 368, 347, 328, 309, 292, 276, 260, 245, 232, 219,
        206, 195, 184, 174, 164, 155, 146, 138, 130, 4966, 4688, 4425, 4176,
        3942, 3721, 3512, 3315, 3129, 2953, 2787, 2631, 2483, 2344, 2212, 2088,
        1971, 1860, 1756, 1657, 1564, 1477, 1394, 1315, 1242, 1172, 1106, 1044,
        985, 930, 878, 829, 782, 738, 697, 658, 621, 586, 553, 522, 493, 465,
        439, 414, 391, 369, 348, 329, 310, 293, 277, 261, 246, 233, 219, 207,
        196, 185, 174, 164, 155, 146, 138, 131, 4984, 4705, 4441, 4191, 3956,
        3734, 3524, 3327, 3140, 2964, 2797, 2640, 2492, 2352, 2220, 2096, 1978,
        1867, 1762, 1663, 1570, 1482, 1399, 1320, 1246, 1176, 1110, 1048, 989,
        934, 881, 832, 785, 741, 699, 660, 623, 588, 555, 524, 495, 467, 441,
        416, 392, 370, 350, 330, 312, 294, 278, 262, 247, 233, 220, 208, 196,
        185, 175, 165, 156, 147, 139, 131, 5002, 4722, 4457, 4206, 3970, 3748,
        3537, 3339, 3151, 2974, 2807, 2650, 2501, 2361, 2228, 2103, 1985, 1874,
        1769, 1669, 1576, 1487, 1404, 1325, 1251, 1180, 1114, 1052, 993, 937,
        884, 835, 788, 744, 702, 662, 625, 590, 557, 526, 496, 468, 442, 417,
        394, 372, 351, 331, 313, 295, 279, 263, 248, 234, 221, 209, 197, 186,
        175, 166, 156, 148, 139, 131, 5020, 4739, 4473, 4222, 3985, 3761, 3550,
        3351, 3163, 2985, 2818, 2659, 2510, 2369, 2236, 2111, 1992, 1881, 1775,
        1675, 1581, 1493, 1409, 1330, 1255, 1185, 1118, 1055, 996, 940, 887,
        838, 791, 746, 704, 665, 628, 592, 559, 528, 498, 470, 444, 419, 395,
        373, 352, 332, 314, 296, 280, 264, 249, 235, 222, 209, 198, 187, 176,
        166, 157, 148, 140, 132, 5039, 4756, 4489, 4237, 3999, 3775, 3563, 3363,
        3174, 2996, 2828, 2669, 2519, 2378, 2244, 2118, 2e3, 1887, 1781, 1681,
        1587, 1498, 1414, 1335, 1260, 1189, 1122, 1059, 1e3, 944, 891, 841, 794,
        749, 707, 667, 630, 594, 561, 530, 500, 472, 445, 420, 397, 374, 353,
        334, 315, 297, 281, 265, 250, 236, 223, 210, 198, 187, 177, 167, 157,
        149, 140, 132, 5057, 4773, 4505, 4252, 4014, 3788, 3576, 3375, 3186,
        3007, 2838, 2679, 2528, 2387, 2253, 2126, 2007, 1894, 1788, 1688, 1593,
        1503, 1419, 1339, 1264, 1193, 1126, 1063, 1003, 947, 894, 844, 796, 752,
        710, 670, 632, 597, 563, 532, 502, 474, 447, 422, 398, 376, 355, 335,
        316, 298, 282, 266, 251, 237, 223, 211, 199, 188, 177, 167, 158, 149,
        141, 133, 5075, 4790, 4521, 4268, 4028, 3802, 3589, 3387, 3197, 3018,
        2848, 2688, 2538, 2395, 2261, 2134, 2014, 1901, 1794, 1694, 1599, 1509,
        1424, 1344, 1269, 1198, 1130, 1067, 1007, 951, 897, 847, 799, 754, 712,
        672, 634, 599, 565, 533, 504, 475, 449, 423, 400, 377, 356, 336, 317,
        299, 283, 267, 252, 238, 224, 212, 200, 189, 178, 168, 159, 150, 141,
        133, 5093, 4808, 4538, 4283, 4043, 3816, 3602, 3399, 3209, 3029, 2859,
        2698, 2547, 2404, 2269, 2142, 2021, 1908, 1801, 1700, 1604, 1514, 1429,
        1349, 1273, 1202, 1134, 1071, 1011, 954, 900, 850, 802, 757, 715, 675,
        637, 601, 567, 535, 505, 477, 450, 425, 401, 379, 357, 337, 318, 300,
        284, 268, 253, 238, 225, 212, 201, 189, 179, 169, 159, 150, 142, 134,
      ];
    window.neoart.DMPlayer = r;
  })();
  (function () {
    function e(e, t) {
      return Object.create(null, {
        index: { value: e, writable: true },
        bitFlag: { value: t, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        trackPtr: { value: 0, writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        frqseqPtr: { value: 0, writable: true },
        frqseqPos: { value: 0, writable: true },
        volseqPtr: { value: 0, writable: true },
        volseqPos: { value: 0, writable: true },
        volseqSpeed: { value: 0, writable: true },
        volseqCounter: { value: 0, writable: true },
        halve: { value: 0, writable: true },
        speed: { value: 0, writable: true },
        tick: { value: 0, writable: true },
        busy: { value: 0, writable: true },
        flags: { value: 0, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        transpose: { value: 0, writable: true },
        portaDelay: { value: 0, writable: true },
        portaDelta: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        vibratoDelta: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.trackPtr = 0;
            this.trackPos = 0;
            this.patternPos = 0;
            this.frqseqPtr = 0;
            this.frqseqPos = 0;
            this.volseqPtr = 0;
            this.volseqPos = 0;
            this.volseqSpeed = 0;
            this.volseqCounter = 0;
            this.halve = 0;
            this.speed = 0;
            this.tick = 1;
            this.busy = -1;
            this.flags = 0;
            this.note = 0;
            this.period = 0;
            this.transpose = 0;
            this.portaDelay = 0;
            this.portaDelta = 0;
            this.portaSpeed = 0;
            this.vibrato = 0;
            this.vibratoDelta = 0;
            this.vibratoSpeed = 0;
            this.vibratoDepth = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        relative: { value: 0, writable: true },
        finetune: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function n() {
      return Object.create(null, {
        speed: { value: 0, writable: true },
        delay: { value: 0, writable: true },
        tracks: { value: null, writable: true },
      });
    }
    function r(r) {
      var i = c(r);
      Object.defineProperties(i, {
        id: { value: "DWPlayer" },
        songs: { value: [], writable: true },
        samples: { value: [], writable: true },
        stream: { value: null, writable: true },
        song: { value: null, writable: true },
        songvol: { value: 0, writable: true },
        master: { value: 0, writable: true },
        periods: { value: 0, writable: true },
        frqseqs: { value: 0, writable: true },
        volseqs: { value: 0, writable: true },
        transpose: { value: 0, writable: true },
        slower: { value: 0, writable: true },
        slowerCounter: { value: 0, writable: true },
        delaySpeed: { value: 0, writable: true },
        delayCounter: { value: 0, writable: true },
        fadeSpeed: { value: 0, writable: true },
        fadeCounter: { value: 0, writable: true },
        wave: { value: null, writable: true },
        waveCenter: { value: 0, writable: true },
        waveLo: { value: 0, writable: true },
        waveHi: { value: 0, writable: true },
        waveDir: { value: 0, writable: true },
        waveLen: { value: 0, writable: true },
        wavePos: { value: 0, writable: true },
        waveRateNeg: { value: 0, writable: true },
        waveRatePos: { value: 0, writable: true },
        voices: { value: [], writable: true },
        active: { value: 0, writable: true },
        complete: { value: 0, writable: true },
        variant: { value: 0, writable: true },
        base: { value: 0, writable: true },
        com2: { value: 0, writable: true },
        com3: { value: 0, writable: true },
        com4: { value: 0, writable: true },
        readMix: { value: "", writable: true },
        readLen: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t,
              n = this.voices[this.active];
            this.reset();
            this.song = this.songs[this.playSong];
            this.songvol = this.master;
            this.speed = this.song.speed;
            this.transpose = 0;
            this.slowerCounter = 6;
            this.delaySpeed = this.song.delay;
            this.delayCounter = 0;
            this.fadeSpeed = 0;
            this.fadeCounter = 0;
            if (this.wave) {
              this.waveDir = 0;
              this.wavePos = this.wave.pointer + this.waveCenter;
              e = this.wave.pointer;
              t = this.wavePos;
              for (; e < t; ++e) this.mixer.memory[e] = this.waveRateNeg;
              t += this.waveCenter;
              for (; e < t; ++e) this.mixer.memory[e] = this.waveRatePos;
            }
            while (n) {
              n.initialize();
              n.channel = this.mixer.channels[n.index];
              n.sample = this.samples[0];
              this.complete += n.bitFlag;
              n.trackPtr = this.song.tracks[n.index];
              n.trackPos = this.readLen;
              this.stream.position = n.trackPtr;
              n.patternPos = this.base + this.stream[this.readMix]();
              if (this.frqseqs) {
                this.stream.position = this.frqseqs;
                n.frqseqPtr = this.base + this.stream.readUshort();
                n.frqseqPos = n.frqseqPtr;
              }
              n = n.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var r,
              i,
              s,
              o,
              u,
              a,
              f,
              l,
              c = 10,
              h,
              p,
              d;
            this.master = 64;
            this.readMix = "readUshort";
            this.readLen = 2;
            this.variant = 0;
            if (e.readUshort() == 18663) {
              e.position = 4;
              if (e.readUshort() != 24832) return;
              e.position += e.readUshort();
              this.variant = 30;
            } else {
              e.position = 0;
            }
            while (d != 20085) {
              d = e.readUshort();
              switch (d) {
                case 18426:
                  this.base = e.position + e.readShort();
                  break;
                case 24832:
                  e.position += 2;
                  u = e.position;
                  if (e.readUshort() == 24832) u = e.position + e.readUshort();
                  break;
                case 49404:
                  c = e.readUshort();
                  if (c == 18) {
                    this.readMix = "readUint";
                    this.readLen = 4;
                  } else {
                    this.variant = 10;
                  }
                  if (e.readUshort() == 16890) i = e.position + e.readUshort();
                  if (e.readUshort() == 4656) r = 1;
                  break;
                case 4656:
                  e.position -= 6;
                  if (e.readUshort() == 16890) {
                    i = e.position + e.readUshort();
                    r = 1;
                  }
                  e.position += 4;
                  break;
                case 48764:
                  this.channels = e.readUshort();
                  e.position += 2;
                  if (e.readUshort() == 14204) this.master = e.readUshort();
                  break;
              }
              if (e.bytesAvailable < 20) return;
            }
            o = e.position;
            this.songs = [];
            a = 2147483647;
            p = 0;
            e.position = i;
            while (1) {
              h = n();
              h.tracks = new Uint32Array(this.channels);
              if (r) {
                h.speed = e.readUbyte();
                h.delay = e.readUbyte();
              } else {
                h.speed = e.readUshort();
              }
              if (h.speed > 255) break;
              for (s = 0; s < this.channels; ++s) {
                d = this.base + e[this.readMix]();
                if (d < a) a = d;
                h.tracks[s] = d;
              }
              this.songs[p++] = h;
              if (a - e.position < c) break;
            }
            if (!p) return;
            this.lastSong = this.songs.length - 1;
            e.position = u;
            if (e.readUshort() != 18987) return;
            i = c = 0;
            this.wave = null;
            while (d != 20085) {
              d = e.readUshort();
              switch (d) {
                case 19450:
                  if (i) break;
                  u = e.position + e.readShort();
                  e.position++;
                  p = e.readUbyte();
                  e.position -= 10;
                  d = e.readUshort();
                  f = e.position;
                  if (d == 16890 || d == 8314) {
                    i = e.position + e.readUshort();
                  } else if (d == 53500) {
                    i = 64 + e.readUshort();
                    e.position -= 18;
                    i += e.position + e.readUshort();
                  }
                  e.position = f;
                  break;
                case 33987:
                  if (c) break;
                  e.position += 4;
                  d = e.readUshort();
                  if (d == 56060) {
                    c = e.readUshort();
                  } else if (d == 56316) {
                    c = e.readUint();
                  }
                  if (c == 12 && this.variant < 30) this.variant = 20;
                  f = e.position;
                  this.samples = [];
                  this.samples.length = ++p;
                  e.position = i;
                  for (s = 0; s < p; ++s) {
                    l = t();
                    l.length = e.readUint();
                    l.relative = parseInt(3579545 / e.readUshort());
                    l.pointer = this.mixer.store(e, l.length);
                    d = e.position;
                    e.position = u + s * c + 4;
                    l.loopPtr = e.readInt();
                    if (this.variant == 0) {
                      e.position += 6;
                      l.volume = e.readUshort();
                    } else if (this.variant == 10) {
                      e.position += 4;
                      l.volume = e.readUshort();
                      l.finetune = e.readByte();
                    }
                    e.position = d;
                    this.samples[s] = l;
                  }
                  this.mixer.loopLen = 64;
                  e.length = i;
                  e.position = f;
                  break;
                case 8314:
                  d = e.position + e.readShort();
                  if (e.readUshort() != 12860) {
                    e.position -= 2;
                    break;
                  }
                  this.wave = this.samples[parseInt((d - u) / c)];
                  this.waveCenter = (e.readUshort() + 1) << 1;
                  e.position += 2;
                  this.waveRateNeg = e.readByte();
                  e.position += 12;
                  this.waveRatePos = e.readByte();
                  break;
                case 1131:
                case 1643:
                  p = e.readUshort();
                  l = this.samples[parseInt((e.readUshort() - u) / c)];
                  if (d == 1643) {
                    l.relative += p;
                  } else {
                    l.relative -= p;
                  }
                  break;
              }
            }
            if (!this.samples.length) return;
            e.position = o;
            this.periods = 0;
            this.frqseqs = 0;
            this.volseqs = 0;
            this.slower = 0;
            this.com2 = 176;
            this.com3 = 160;
            this.com4 = 144;
            while (e.bytesAvailable > 16) {
              d = e.readUshort();
              switch (d) {
                case 18426:
                  e.position += 2;
                  if (e.readUshort() != 18987) break;
                  f = e.position;
                  e.position += 4;
                  d = e.readUshort();
                  if (d == 4154) {
                    e.position += 4;
                    if (e.readUshort() == 49404) {
                      d = e.readUshort();
                      p = this.songs.length;
                      for (s = 0; s < p; ++s) this.songs[s].delay *= d;
                      e.position += 6;
                    }
                  } else if (d == 21291) {
                    e.position -= 8;
                  }
                  d = e.readUshort();
                  if (d == 18987) {
                    e.position = this.base + e.readUshort();
                    this.slower = e.readByte();
                  }
                  e.position = f;
                  break;
                case 3179:
                  e.position -= 6;
                  d = e.readUshort();
                  if (d == 21611 || d == 21099) {
                    e.position += 4;
                    this.waveHi = this.wave.pointer + e.readUshort();
                  } else if (d == 21867 || d == 21355) {
                    e.position += 4;
                    this.waveLo = this.wave.pointer + e.readUshort();
                  }
                  this.waveLen = d < 21611 ? 1 : 2;
                  break;
                case 32256:
                case 32257:
                case 32258:
                case 32259:
                  this.active = d & 15;
                  p = this.channels - 1;
                  if (this.active) {
                    this.voices[0].next = null;
                    for (s = p; s > 0; ) this.voices[s].next = this.voices[--s];
                  } else {
                    this.voices[p].next = null;
                    for (s = 0; s < p; ) this.voices[s].next = this.voices[++s];
                  }
                  break;
                case 3176:
                  e.position += 22;
                  if (e.readUshort() == 3089) this.variant = 40;
                  break;
                case 12845:
                  f = e.position;
                  d = e.readUshort();
                  if (d == 10 || d == 12) {
                    e.position -= 8;
                    if (e.readUshort() == 17914)
                      this.periods = e.position + e.readUshort();
                  }
                  e.position = f + 2;
                  break;
                case 1024:
                case 1088:
                case 1536:
                  d = e.readUshort();
                  if (d == 192 || d == 64) {
                    this.com2 = 192;
                    this.com3 = 176;
                    this.com4 = 160;
                  } else if (d == this.com3) {
                    e.position += 2;
                    if (e.readUshort() == 17914) {
                      this.volseqs = e.position + e.readUshort();
                      if (this.variant < 40) this.variant = 30;
                    }
                  } else if (d == this.com4) {
                    e.position += 2;
                    if (e.readUshort() == 17914)
                      this.frqseqs = e.position + e.readUshort();
                  }
                  break;
                case 20211:
                  e.position += 2;
                case 20178:
                  a = e.position;
                  e.position -= 10;
                  e.position += e.readUshort();
                  f = e.position;
                  e.position = f + 2;
                  e.position = this.base + e.readUshort() + 10;
                  if (e.readUshort() == 18964) this.variant = 41;
                  e.position = f + 16;
                  d = this.base + e.readUshort();
                  if (d > a && d < f) {
                    e.position = d;
                    d = e.readUshort();
                    if (d == 20712) {
                      this.variant = 21;
                    } else if (d == 5977) {
                      this.variant = 11;
                    }
                  }
                  e.position = f + 20;
                  d = this.base + e.readUshort();
                  if (d > a && d < f) {
                    e.position = d + 2;
                    if (e.readUshort() != 18560) this.variant = 31;
                  }
                  e.position = f + 26;
                  d = e.readUshort();
                  if (d > a && d < f) this.variant = 32;
                  if (this.frqseqs) e.position = e.length;
                  break;
              }
            }
            if (!this.periods) return;
            this.com2 -= 256;
            this.com3 -= 256;
            this.com4 -= 256;
            this.stream = e;
            this.version = 1;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.voices[this.active],
              o;
            if (this.slower) {
              if (--this.slowerCounter == 0) {
                this.slowerCounter = 6;
                return;
              }
            }
            if ((this.delayCounter += this.delaySpeed) > 255) {
              this.delayCounter -= 256;
              return;
            }
            if (this.fadeSpeed) {
              if (--this.fadeCounter == 0) {
                this.fadeCounter = this.fadeSpeed;
                this.songvol--;
              }
              if (!this.songvol) {
                if (!this.loopSong) {
                  this.mixer.complete = 1;
                  return;
                } else {
                  this.initialize();
                }
              }
            }
            if (this.wave) {
              if (this.waveDir) {
                this.mixer.memory[this.wavePos++] = this.waveRatePos;
                if (this.waveLen > 1)
                  this.mixer.memory[this.wavePos++] = this.waveRatePos;
                if ((this.wavePos -= this.waveLen << 1) == this.waveLo)
                  this.waveDir = 0;
              } else {
                this.mixer.memory[this.wavePos++] = this.waveRateNeg;
                if (this.waveLen > 1)
                  this.mixer.memory[this.wavePos++] = this.waveRateNeg;
                if (this.wavePos == this.waveHi) this.waveDir = 1;
              }
            }
            while (s) {
              e = s.channel;
              this.stream.position = s.patternPos;
              r = s.sample;
              if (!s.busy) {
                s.busy = 1;
                if (r.loopPtr < 0) {
                  e.pointer = this.mixer.loopPtr;
                  e.length = this.mixer.loopLen;
                } else {
                  e.pointer = r.pointer + r.loopPtr;
                  e.length = r.length - r.loopPtr;
                }
              }
              if (--s.tick == 0) {
                s.flags = 0;
                t = 1;
                while (t > 0) {
                  i = this.stream.readByte();
                  if (i < 0) {
                    if (i >= -32) {
                      s.speed = this.speed * (i + 33);
                    } else if (i >= this.com2) {
                      i -= this.com2;
                      s.sample = r = this.samples[i];
                    } else if (i >= this.com3) {
                      n = this.stream.position;
                      this.stream.position =
                        this.volseqs + ((i - this.com3) << 1);
                      this.stream.position =
                        this.base + this.stream.readUshort();
                      s.volseqPtr = this.stream.position;
                      this.stream.position--;
                      s.volseqSpeed = this.stream.readUbyte();
                      this.stream.position = n;
                    } else if (i >= this.com4) {
                      n = this.stream.position;
                      this.stream.position =
                        this.frqseqs + ((i - this.com4) << 1);
                      s.frqseqPtr = this.base + this.stream.readUshort();
                      s.frqseqPos = s.frqseqPtr;
                      this.stream.position = n;
                    } else {
                      switch (i) {
                        case -128:
                          this.stream.position = s.trackPtr + s.trackPos;
                          i = this.stream[this.readMix]();
                          if (i) {
                            this.stream.position = this.base + i;
                            s.trackPos += this.readLen;
                          } else {
                            this.stream.position = s.trackPtr;
                            this.stream.position =
                              this.base + this.stream[this.readMix]();
                            s.trackPos = this.readLen;
                            if (!this.loopSong) {
                              this.complete &= ~s.bitFlag;
                              if (!this.complete) this.mixer.complete = 1;
                            }
                          }
                          break;
                        case -127:
                          if (this.variant > 0) s.portaDelta = 0;
                          s.portaSpeed = this.stream.readByte();
                          s.portaDelay = this.stream.readUbyte();
                          s.flags |= 2;
                          break;
                        case -126:
                          s.tick = s.speed;
                          s.patternPos = this.stream.position;
                          if (this.variant == 41) {
                            s.busy = 1;
                            e.enabled = 0;
                          } else {
                            e.pointer = this.mixer.loopPtr;
                            e.length = this.mixer.loopLen;
                          }
                          t = 0;
                          break;
                        case -125:
                          if (this.variant > 0) {
                            s.tick = s.speed;
                            s.patternPos = this.stream.position;
                            e.enabled = 1;
                            t = 0;
                          }
                          break;
                        case -124:
                          this.mixer.complete = 1;
                          break;
                        case -123:
                          if (this.variant > 0)
                            this.transpose = this.stream.readByte();
                          break;
                        case -122:
                          s.vibrato = -1;
                          s.vibratoSpeed = this.stream.readUbyte();
                          s.vibratoDepth = this.stream.readUbyte();
                          s.vibratoDelta = 0;
                          break;
                        case -121:
                          s.vibrato = 0;
                          break;
                        case -120:
                          if (this.variant == 21) {
                            s.halve = 1;
                          } else if (this.variant == 11) {
                            this.fadeSpeed = this.stream.readUbyte();
                          } else {
                            s.transpose = this.stream.readByte();
                          }
                          break;
                        case -119:
                          if (this.variant == 21) {
                            s.halve = 0;
                          } else {
                            s.trackPtr = this.base + this.stream.readUshort();
                            s.trackPos = 0;
                          }
                          break;
                        case -118:
                          if (this.variant == 31) {
                            this.delaySpeed = this.stream.readUbyte();
                          } else {
                            this.speed = this.stream.readUbyte();
                          }
                          break;
                        case -117:
                          this.fadeSpeed = this.stream.readUbyte();
                          this.fadeCounter = this.fadeSpeed;
                          break;
                        case -116:
                          i = this.stream.readUbyte();
                          if (this.variant != 32) this.songvol = i;
                          break;
                      }
                    }
                  } else {
                    s.patternPos = this.stream.position;
                    s.note = i += r.finetune;
                    s.tick = s.speed;
                    s.busy = 0;
                    if (this.variant >= 20) {
                      i = (i + this.transpose + s.transpose) & 255;
                      this.stream.position = s.volseqPtr;
                      o = this.stream.readUbyte();
                      s.volseqPos = this.stream.position;
                      s.volseqCounter = s.volseqSpeed;
                      if (s.halve) o >>= 1;
                      o = (o * this.songvol) >> 6;
                    } else {
                      o = r.volume;
                    }
                    e.pointer = r.pointer;
                    e.length = r.length;
                    e.volume = o;
                    this.stream.position = this.periods + (i << 1);
                    i = (this.stream.readUshort() * r.relative) >> 10;
                    if (this.variant < 10) s.portaDelta = i;
                    e.period = i;
                    e.enabled = 1;
                    t = 0;
                  }
                }
              } else if (s.tick == 1) {
                if (this.variant < 30) {
                  e.enabled = 0;
                } else {
                  i = this.stream.readUbyte();
                  if (i != 131) {
                    if (
                      this.variant < 40 ||
                      i < 224 ||
                      this.stream.readUbyte() != 131
                    )
                      e.enabled = 0;
                  }
                }
              } else if (this.variant == 0) {
                if (s.flags & 2) {
                  if (s.portaDelay) {
                    s.portaDelay--;
                  } else {
                    s.portaDelta -= s.portaSpeed;
                    e.period = s.portaDelta;
                  }
                }
              } else {
                this.stream.position = s.frqseqPos;
                i = this.stream.readByte();
                if (i < 0) {
                  i &= 127;
                  this.stream.position = s.frqseqPtr;
                }
                s.frqseqPos = this.stream.position;
                i = (i + s.note + this.transpose + s.transpose) & 255;
                this.stream.position = this.periods + (i << 1);
                i = (this.stream.readUshort() * r.relative) >> 10;
                if (s.flags & 2) {
                  if (s.portaDelay) {
                    s.portaDelay--;
                  } else {
                    s.portaDelta += s.portaSpeed;
                    i -= s.portaDelta;
                  }
                }
                if (s.vibrato) {
                  if (s.vibrato > 0) {
                    s.vibratoDelta -= s.vibratoSpeed;
                    if (!s.vibratoDelta) s.vibrato ^= 2147483648;
                  } else {
                    s.vibratoDelta += s.vibratoSpeed;
                    if (s.vibratoDelta == s.vibratoDepth)
                      s.vibrato ^= 2147483648;
                  }
                  if (!s.vibratoDelta) s.vibrato ^= 1;
                  if (s.vibrato & 1) {
                    i += s.vibratoDelta;
                  } else {
                    i -= s.vibratoDelta;
                  }
                }
                e.period = i;
                if (this.variant >= 20) {
                  if (--s.volseqCounter < 0) {
                    this.stream.position = s.volseqPos;
                    o = this.stream.readByte();
                    if (o >= 0) s.volseqPos = this.stream.position;
                    s.volseqCounter = s.volseqSpeed;
                    o &= 127;
                    if (s.halve) o >>= 1;
                    e.volume = (o * this.songvol) >> 6;
                  }
                }
              }
              s = s.next;
            }
          },
        },
      });
      i.voices[0] = e(0, 1);
      i.voices[1] = e(1, 2);
      i.voices[2] = e(2, 4);
      i.voices[3] = e(3, 8);
      return Object.seal(i);
    }
    window.neoart.DWPlayer = r;
  })();
  (function () {
    function t(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        pattern: { value: 0, writable: true },
        soundTranspose: { value: 0, writable: true },
        transpose: { value: 0, writable: true },
        patStep: { value: 0, writable: true },
        frqStep: { value: 0, writable: true },
        frqPos: { value: 0, writable: true },
        frqSustain: { value: 0, writable: true },
        frqTranspose: { value: 0, writable: true },
        volStep: { value: 0, writable: true },
        volPos: { value: 0, writable: true },
        volCtr: { value: 0, writable: true },
        volSpeed: { value: 0, writable: true },
        volSustain: { value: 0, writable: true },
        note: { value: 0, writable: true },
        pitch: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        pitchBendFlag: { value: 0, writable: true },
        pitchBendSpeed: { value: 0, writable: true },
        pitchBendTime: { value: 0, writable: true },
        portamentoFlag: { value: 0, writable: true },
        portamento: { value: 0, writable: true },
        volBendFlag: { value: 0, writable: true },
        volBendSpeed: { value: 0, writable: true },
        volBendTime: { value: 0, writable: true },
        vibratoFlag: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        vibratoDelay: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.sample = null;
            this.enabled = 0;
            this.pattern = 0;
            this.soundTranspose = 0;
            this.transpose = 0;
            this.patStep = 0;
            this.frqStep = 0;
            this.frqPos = 0;
            this.frqSustain = 0;
            this.frqTranspose = 0;
            this.volStep = 0;
            this.volPos = 0;
            this.volCtr = 1;
            this.volSpeed = 1;
            this.volSustain = 0;
            this.note = 0;
            this.pitch = 0;
            this.volume = 0;
            this.pitchBendFlag = 0;
            this.pitchBendSpeed = 0;
            this.pitchBendTime = 0;
            this.portamentoFlag = 0;
            this.portamento = 0;
            this.volBendFlag = 0;
            this.volBendSpeed = 0;
            this.volBendTime = 0;
            this.vibratoFlag = 0;
            this.vibratoSpeed = 0;
            this.vibratoDepth = 0;
            this.vibratoDelay = 0;
            this.vibrato = 0;
          },
        },
        volumeBend: {
          value: function () {
            this.volBendFlag ^= 1;
            if (this.volBendFlag) {
              this.volBendTime--;
              this.volume += this.volBendSpeed;
              if (this.volume < 0 || this.volume > 64) this.volBendTime = 0;
            }
          },
        },
      });
    }
    function n(n) {
      var u = c(n);
      Object.defineProperties(u, {
        id: { value: "FCPlayer" },
        seqs: { value: null, writable: true },
        pats: { value: null, writable: true },
        vols: { value: null, writable: true },
        frqs: { value: null, writable: true },
        length: { value: 0, writable: true },
        samples: { value: [], writable: true },
        voices: { value: [], writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.seqs.position = 0;
            this.pats.position = 0;
            this.vols.position = 0;
            this.frqs.position = 0;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.pattern = this.seqs.readUbyte() << 6;
              e.transpose = this.seqs.readByte();
              e.soundTranspose = this.seqs.readByte();
              e = e.next;
            }
            this.speed = this.seqs.readUbyte();
            if (!this.speed) this.speed = 3;
            this.tick = this.speed;
          },
        },
        loader: {
          value: function (t) {
            var n, s, u, f, l, c, h, p, d, v;
            s = t.readString(4);
            if (s == "SMOD") this.version = r;
            else if (s == "FC14") this.version = i;
            else return;
            t.position = 4;
            this.length = t.readUint();
            t.position = this.version == r ? 100 : 180;
            this.seqs = e(new ArrayBuffer(this.length));
            t.readBytes(this.seqs, 0, this.length);
            this.length = (this.length / 13) >> 0;
            t.position = 12;
            f = t.readUint();
            t.position = 8;
            t.position = t.readUint();
            this.pats = e(new ArrayBuffer(f + 1));
            t.readBytes(this.pats, 0, f);
            t.position = 20;
            f = t.readUint();
            t.position = 16;
            t.position = t.readUint();
            this.frqs = e(new ArrayBuffer(f + 9));
            this.frqs.writeInt(16777216);
            this.frqs.writeInt(225);
            t.readBytes(this.frqs, 8, f);
            this.frqs.position = this.frqs.length - 1;
            this.frqs.writeByte(225);
            this.frqs.position = 0;
            t.position = 28;
            f = t.readUint();
            t.position = 24;
            t.position = t.readUint();
            this.vols = e(new ArrayBuffer(f + 8));
            this.vols.writeInt(16777216);
            this.vols.writeInt(225);
            t.readBytes(this.vols, 8, f);
            t.position = 32;
            p = t.readUint();
            t.position = 40;
            if (this.version == r) {
              (this.samples.length = 57), (l = 0);
            } else {
              this.samples.length = 200;
              l = 2;
            }
            for (n = 0; n < 10; ++n) {
              f = t.readUshort() << 1;
              if (f > 0) {
                c = t.position;
                t.position = p;
                s = t.readString(4);
                if (s == "SSMP") {
                  d = f;
                  for (u = 0; u < 10; ++u) {
                    t.readInt();
                    f = t.readUshort() << 1;
                    if (f > 0) {
                      h = a();
                      h.length = f + 2;
                      h.loop = t.readUshort();
                      h.repeat = t.readUshort() << 1;
                      if (h.loop + h.repeat > h.length)
                        h.repeat = h.length - h.loop;
                      if (p + h.length > t.length) h.length = t.length - p;
                      h.pointer = this.mixer.store(t, h.length, p + v);
                      h.loopPtr = h.pointer + h.loop;
                      this.samples[100 + n * 10 + u] = h;
                      v += h.length;
                      t.position += 6;
                    } else {
                      t.position += 10;
                    }
                  }
                  p += d + 2;
                  t.position = c + 4;
                } else {
                  t.position = c;
                  h = a();
                  h.length = f + l;
                  h.loop = t.readUshort();
                  h.repeat = t.readUshort() << 1;
                  if (h.loop + h.repeat > h.length)
                    h.repeat = h.length - h.loop;
                  if (p + h.length > t.length) h.length = t.length - p;
                  h.pointer = this.mixer.store(t, h.length, p);
                  h.loopPtr = h.pointer + h.loop;
                  this.samples[n] = h;
                  p += h.length;
                }
              } else {
                t.position += 4;
              }
            }
            if (this.version == r) {
              l = 0;
              d = 47;
              for (n = 10; n < 57; ++n) {
                h = a();
                h.length = o[l++] << 1;
                h.loop = 0;
                h.repeat = h.length;
                c = this.mixer.memory.length;
                h.pointer = c;
                h.loopPtr = c;
                this.samples[n] = h;
                f = c + h.length;
                for (u = c; u < f; ++u) this.mixer.memory[u] = o[d++];
              }
            } else {
              t.position = 36;
              p = t.readUint();
              t.position = 100;
              for (n = 10; n < 90; ++n) {
                f = t.readUbyte() << 1;
                if (f < 2) continue;
                h = a();
                h.length = f;
                h.loop = 0;
                h.repeat = h.length;
                if (p + h.length > t.length) h.length = t.length - p;
                h.pointer = this.mixer.store(t, h.length, p);
                h.loopPtr = h.pointer;
                this.samples[n] = h;
                p += h.length;
              }
            }
            this.length *= 13;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              i,
              o,
              u,
              a,
              f,
              l,
              c,
              h = this.voices[0];
            if (--this.tick == 0) {
              e = this.seqs.position;
              while (h) {
                t = h.channel;
                this.pats.position = h.pattern + h.patStep;
                c = this.pats.readUbyte();
                if (h.patStep >= 64 || c == 73) {
                  if (this.seqs.position == this.length) {
                    this.seqs.position = 0;
                    this.mixer.complete = 1;
                  }
                  h.patStep = 0;
                  h.pattern = this.seqs.readUbyte() << 6;
                  h.transpose = this.seqs.readByte();
                  h.soundTranspose = this.seqs.readByte();
                  this.pats.position = h.pattern;
                  c = this.pats.readUbyte();
                }
                o = this.pats.readUbyte();
                this.frqs.position = 0;
                this.vols.position = 0;
                if (c != 0) {
                  h.note = c & 127;
                  h.pitch = 0;
                  h.portamento = 0;
                  h.enabled = t.enabled = 0;
                  c = 8 + (((o & 63) + h.soundTranspose) << 6);
                  if (c >= 0 && c < this.vols.length) this.vols.position = c;
                  h.volStep = 0;
                  h.volSpeed = h.volCtr = this.vols.readUbyte();
                  h.volSustain = 0;
                  h.frqPos = 8 + (this.vols.readUbyte() << 6);
                  h.frqStep = 0;
                  h.frqSustain = 0;
                  h.vibratoFlag = 0;
                  h.vibratoSpeed = this.vols.readUbyte();
                  h.vibratoDepth = h.vibrato = this.vols.readUbyte();
                  h.vibratoDelay = this.vols.readUbyte();
                  h.volPos = this.vols.position;
                }
                if (o & 64) {
                  h.portamento = 0;
                } else if (o & 128) {
                  h.portamento = this.pats[this.pats.position + 1];
                  if (this.version == r) h.portamento <<= 1;
                }
                h.patStep += 2;
                h = h.next;
              }
              if (this.seqs.position != e) {
                c = this.seqs.readUbyte();
                if (c) this.speed = c;
              }
              this.tick = this.speed;
            }
            h = this.voices[0];
            while (h) {
              t = h.channel;
              do {
                a = 0;
                if (h.frqSustain) {
                  h.frqSustain--;
                  break;
                }
                this.frqs.position = h.frqPos + h.frqStep;
                do {
                  u = 0;
                  if (!this.frqs.bytesAvailable) break;
                  o = this.frqs.readUbyte();
                  if (o == 225) break;
                  if (o == 224) {
                    h.frqStep = this.frqs.readUbyte() & 63;
                    this.frqs.position = h.frqPos + h.frqStep;
                    o = this.frqs.readUbyte();
                  }
                  switch (o) {
                    case 226:
                      t.enabled = 0;
                      h.enabled = 1;
                      h.volCtr = 1;
                      h.volStep = 0;
                    case 228:
                      l = this.samples[this.frqs.readUbyte()];
                      if (l) {
                        t.pointer = l.pointer;
                        t.length = l.length;
                      } else {
                        h.enabled = 0;
                      }
                      h.sample = l;
                      h.frqStep += 2;
                      break;
                    case 233:
                      c = 100 + this.frqs.readUbyte() * 10;
                      l = this.samples[c + this.frqs.readUbyte()];
                      if (l) {
                        t.enabled = 0;
                        t.pointer = l.pointer;
                        t.length = l.length;
                        h.enabled = 1;
                      }
                      h.sample = l;
                      h.volCtr = 1;
                      h.volStep = 0;
                      h.frqStep += 3;
                      break;
                    case 231:
                      u = 1;
                      h.frqPos = 8 + (this.frqs.readUbyte() << 6);
                      if (h.frqPos >= this.frqs.length) h.frqPos = 0;
                      h.frqStep = 0;
                      this.frqs.position = h.frqPos;
                      break;
                    case 234:
                      h.pitchBendSpeed = this.frqs.readByte();
                      h.pitchBendTime = this.frqs.readUbyte();
                      h.frqStep += 3;
                      break;
                    case 232:
                      a = 1;
                      h.frqSustain = this.frqs.readUbyte();
                      h.frqStep += 2;
                      break;
                    case 227:
                      h.vibratoSpeed = this.frqs.readUbyte();
                      h.vibratoDepth = this.frqs.readUbyte();
                      h.frqStep += 3;
                      break;
                  }
                  if (!a && !u) {
                    this.frqs.position = h.frqPos + h.frqStep;
                    h.frqTranspose = this.frqs.readByte();
                    h.frqStep++;
                  }
                } while (u);
              } while (a);
              if (h.volSustain) {
                h.volSustain--;
              } else {
                if (h.volBendTime) {
                  h.volumeBend();
                } else {
                  if (--h.volCtr == 0) {
                    h.volCtr = h.volSpeed;
                    do {
                      u = 0;
                      this.vols.position = h.volPos + h.volStep;
                      if (!this.vols.bytesAvailable) break;
                      o = this.vols.readUbyte();
                      if (o == 225) break;
                      switch (o) {
                        case 234:
                          h.volBendSpeed = this.vols.readByte();
                          h.volBendTime = this.vols.readUbyte();
                          h.volStep += 3;
                          h.volumeBend();
                          break;
                        case 232:
                          h.volSustain = this.vols.readUbyte();
                          h.volStep += 2;
                          break;
                        case 224:
                          u = 1;
                          c = this.vols.readUbyte() & 63;
                          h.volStep = c - 5;
                          break;
                        default:
                          h.volume = o;
                          h.volStep++;
                          break;
                      }
                    } while (u);
                  }
                }
              }
              o = h.frqTranspose;
              if (o >= 0) o += h.note + h.transpose;
              o &= 127;
              f = s[o];
              if (h.vibratoDelay) {
                h.vibratoDelay--;
              } else {
                c = h.vibrato;
                if (h.vibratoFlag) {
                  n = h.vibratoDepth << 1;
                  c += h.vibratoSpeed;
                  if (c > n) {
                    c = n;
                    h.vibratoFlag = 0;
                  }
                } else {
                  c -= h.vibratoSpeed;
                  if (c < 0) {
                    c = 0;
                    h.vibratoFlag = 1;
                  }
                }
                h.vibrato = c;
                c -= h.vibratoDepth;
                e = (o << 1) + 160;
                while (e < 256) {
                  c <<= 1;
                  e += 24;
                }
                f += c;
              }
              h.portamentoFlag ^= 1;
              if (h.portamentoFlag && h.portamento) {
                if (h.portamento > 31) h.pitch += h.portamento & 31;
                else h.pitch -= h.portamento;
              }
              h.pitchBendFlag ^= 1;
              if (h.pitchBendFlag && h.pitchBendTime) {
                h.pitchBendTime--;
                h.pitch -= h.pitchBendSpeed;
              }
              f += h.pitch;
              if (f < 113) f = 113;
              else if (f > 3424) f = 3424;
              t.period = f;
              t.volume = h.volume;
              if (h.sample) {
                l = h.sample;
                t.enabled = h.enabled;
                t.pointer = l.loopPtr;
                t.length = l.repeat;
              }
              h = h.next;
            }
          },
        },
      });
      u.voices[0] = t(0);
      u.voices[0].next = u.voices[1] = t(1);
      u.voices[1].next = u.voices[2] = t(2);
      u.voices[2].next = u.voices[3] = t(3);
      return Object.seal(u);
    }
    var r = 1,
      i = 2,
      s = [
        1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 906,
        856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
        381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 113, 113, 113, 113, 113, 113,
        113, 113, 113, 113, 113, 113, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
        2280, 2152, 2032, 1920, 1812, 1712, 1616, 1524, 1440, 1356, 1280, 1208,
        1140, 1076, 1016, 960, 906, 856, 808, 762, 720, 678, 640, 604, 570, 538,
        508, 480, 453, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240,
        226, 214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, 113,
        113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
      ],
      o = [
        16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
        16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 8, 8, 8, 8, 8,
        8, 8, 8, 16, 8, 16, 16, 8, 8, 24, -64, -64, -48, -40, -32, -24, -16, -8,
        0, -8, -16, -24, -32, -40, -48, -56, 63, 55, 47, 39, 31, 23, 15, 7, -1,
        7, 15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8,
        -16, -24, -32, -40, -48, -56, -64, 55, 47, 39, 31, 23, 15, 7, -1, 7, 15,
        23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16,
        -24, -32, -40, -48, -56, -64, -72, 47, 39, 31, 23, 15, 7, -1, 7, 15, 23,
        31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24,
        -32, -40, -48, -56, -64, -72, -80, 39, 31, 23, 15, 7, -1, 7, 15, 23, 31,
        39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
        -40, -48, -56, -64, -72, -80, -88, 31, 23, 15, 7, -1, 7, 15, 23, 31, 39,
        47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
        -40, -48, -56, -64, -72, -80, -88, -96, 23, 15, 7, -1, 7, 15, 23, 31,
        39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
        -40, -48, -56, -64, -72, -80, -88, -96, -104, 15, 7, -1, 7, 15, 23, 31,
        39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
        -40, -48, -56, -64, -72, -80, -88, -96, -104, -112, 7, -1, 7, 15, 23,
        31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24,
        -32, -40, -48, -56, -64, -72, -80, -88, -96, -104, -112, -120, -1, 7,
        15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8,
        -16, -24, -32, -40, -48, -56, -64, -72, -80, -88, -96, -104, -112, -120,
        -128, 7, 15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8,
        0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88, -96, -104,
        -112, -120, -128, -120, 15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32,
        -24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88,
        -96, -104, -112, -120, -128, -120, -112, 23, 31, 39, 47, 55, -64, -64,
        -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56, -64,
        -72, -80, -88, -96, -104, -112, -120, -128, -120, -112, -104, 31, 39,
        47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
        -40, -48, -56, -64, -72, -80, -88, -96, -104, -112, -120, -128, -120,
        -112, -104, -96, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0,
        -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88, -96, -104, -112,
        -120, -128, -120, -112, -104, -96, -88, 47, 55, -64, -64, -48, -40, -32,
        -24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88,
        -96, -104, -112, -120, -128, -120, -112, -104, -96, -88, -80, 55, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
        127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, 127,
        127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, 127,
        127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, 127, 127, 127, 127, 127, 127,
        127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, 127,
        127, 127, 127, 127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127, 127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
        -127, -127, -127, -127, -127, 127, 127, 127, -128, -128, -128, -128,
        -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
        -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
        -128, -128, 127, 127, -128, -128, -128, -128, -128, -128, -128, -128,
        -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
        -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, -128, 127,
        -128, -128, -128, -128, -128, -128, -128, -128, 127, 127, 127, 127, 127,
        127, 127, 127, -128, -128, -128, -128, -128, -128, -128, 127, 127, 127,
        127, 127, 127, 127, 127, 127, -128, -128, -128, -128, -128, -128, 127,
        127, 127, 127, 127, 127, 127, 127, 127, 127, -128, -128, -128, -128,
        -128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -128, -128,
        -128, -128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
        -128, -128, -128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, -128, -128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, -128, -128, 127, 127, 127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, 127, -128, -128, -112, -104, -96, -88, -80,
        -72, -64, -56, -48, -40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40, 48,
        56, 64, 72, 80, 88, 96, 104, 112, 127, -128, -128, -96, -80, -64, -48,
        -32, -16, 0, 16, 32, 48, 64, 80, 96, 112, 69, 69, 121, 125, 122, 119,
        112, 102, 97, 88, 83, 77, 44, 32, 24, 18, 4, -37, -45, -51, -58, -68,
        -75, -82, -88, -93, -99, -103, -109, -114, -117, -118, 69, 69, 121, 125,
        122, 119, 112, 102, 91, 75, 67, 55, 44, 32, 24, 18, 4, -8, -24, -37,
        -49, -58, -66, -80, -88, -92, -98, -102, -107, -108, -115, -125, 0, 0,
        64, 96, 127, 96, 64, 32, 0, -32, -64, -96, -128, -96, -64, -32, 0, 0,
        64, 96, 127, 96, 64, 32, 0, -32, -64, -96, -128, -96, -64, -32, -128,
        -128, -112, -104, -96, -88, -80, -72, -64, -56, -48, -40, -32, -24, -16,
        -8, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 127,
        -128, -128, -96, -80, -64, -48, -32, -16, 0, 16, 32, 48, 64, 80, 96,
        112,
      ];
    window.neoart.FCPlayer = n;
  })();
  (function () {
    function t(e, t) {
      return Object.create(null, {
        index: { value: e, writable: true },
        bitFlag: { value: t, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        tick: { value: 0, writable: true },
        busy: { value: 0, writable: true },
        synth: { value: 0, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        envelopePos: { value: 0, writable: true },
        sustainTime: { value: 0, writable: true },
        arpeggioPos: { value: 0, writable: true },
        arpeggioSpeed: { value: 0, writable: true },
        portamento: { value: 0, writable: true },
        portaCounter: { value: 0, writable: true },
        portaDelay: { value: 0, writable: true },
        portaFlag: { value: 0, writable: true },
        portaLimit: { value: 0, writable: true },
        portaNote: { value: 0, writable: true },
        portaPeriod: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        vibratoDelay: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        vibratoFlag: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        pulseCounter: { value: 0, writable: true },
        pulseDelay: { value: 0, writable: true },
        pulseDir: { value: 0, writable: true },
        pulsePos: { value: 0, writable: true },
        pulseSpeed: { value: 0, writable: true },
        blendCounter: { value: 0, writable: true },
        blendDelay: { value: 0, writable: true },
        blendDir: { value: 0, writable: true },
        blendPos: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.trackPos = 0;
            this.patternPos = 0;
            this.tick = 1;
            this.busy = 1;
            this.note = 0;
            this.period = 0;
            this.volume = 0;
            this.envelopePos = 0;
            this.sustainTime = 0;
            this.arpeggioPos = 0;
            this.arpeggioSpeed = 0;
            this.portamento = 0;
            this.portaCounter = 0;
            this.portaDelay = 0;
            this.portaFlag = 0;
            this.portaLimit = 0;
            this.portaNote = 0;
            this.portaPeriod = 0;
            this.portaSpeed = 0;
            this.vibrato = 0;
            this.vibratoDelay = 0;
            this.vibratoDepth = 0;
            this.vibratoFlag = 0;
            this.vibratoSpeed = 0;
            this.pulseCounter = 0;
            this.pulseDelay = 0;
            this.pulseDir = 0;
            this.pulsePos = 0;
            this.pulseSpeed = 0;
            this.blendCounter = 0;
            this.blendDelay = 0;
            this.blendDir = 0;
            this.blendPos = 0;
          },
        },
      });
    }
    function n() {
      return Object.create(null, {
        pointer: { value: 0, writable: true },
        loopPtr: { value: 0, writable: true },
        length: { value: 0, writable: true },
        relative: { value: 0, writable: true },
        type: { value: 0, writable: true },
        synchro: { value: 0, writable: true },
        envelopeVol: { value: 0, writable: true },
        attackSpeed: { value: 0, writable: true },
        attackVol: { value: 0, writable: true },
        decaySpeed: { value: 0, writable: true },
        decayVol: { value: 0, writable: true },
        sustainTime: { value: 0, writable: true },
        releaseSpeed: { value: 0, writable: true },
        releaseVol: { value: 0, writable: true },
        arpeggio: { value: null, writable: true },
        arpeggioLimit: { value: 0, writable: true },
        arpeggioSpeed: { value: 0, writable: true },
        vibratoDelay: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        pulseCounter: { value: 0, writable: true },
        pulseDelay: { value: 0, writable: true },
        pulsePosL: { value: 0, writable: true },
        pulsePosH: { value: 0, writable: true },
        pulseSpeed: { value: 0, writable: true },
        pulseRateNeg: { value: 0, writable: true },
        pulseRatePos: { value: 0, writable: true },
        blendCounter: { value: 0, writable: true },
        blendDelay: { value: 0, writable: true },
        blendRate: { value: 0, writable: true },
      });
    }
    function r() {
      return Object.create(null, {
        speed: { value: 0, writable: true },
        length: { value: 0, writable: true },
        tracks: { value: [], writable: true },
      });
    }
    function i(i) {
      var o = c(i);
      Object.defineProperties(o, {
        id: { value: "FEPlayer" },
        songs: { value: [], writable: true },
        samples: { value: [], writable: true },
        patterns: { value: null, writable: true },
        song: { value: null, writable: true },
        voices: { value: [], writable: true },
        complete: { value: 0, writable: true },
        sampFlag: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t,
              n = this.voices[3];
            this.reset();
            this.song = this.songs[this.playSong];
            this.speed = this.song.speed;
            this.complete = 15;
            while (n) {
              n.initialize();
              n.channel = this.mixer.channels[n.index];
              n.patternPos = this.song.tracks[n.index][0];
              e = n.synth;
              t = e + 64;
              for (; e < t; ++e) this.mixer.memory[e] = 0;
              n = n.next;
            }
          },
        },
        loader: {
          value: function (t) {
            var i, s, o, u, a, f, l, c, h, p, d, v;
            while (t.position < 16) {
              v = t.readUshort();
              t.position += 2;
              if (v != 20218) return;
            }
            while (t.position < 1024) {
              v = t.readUshort();
              if (v == 4666) {
                t.position += 2;
                v = t.readUshort();
                if (v == 45057) {
                  t.position -= 4;
                  s = t.position + t.readUshort() - 2197;
                }
              } else if (v == 8522) {
                t.position += 2;
                v = t.readUshort();
                if (v == 18426) {
                  i = t.position + t.readShort();
                  this.version = 1;
                  break;
                }
              }
            }
            if (!this.version) return;
            t.position = s + 2210;
            f = t.readUint();
            t.position = i + f;
            this.samples = [];
            f = 2147483647;
            while (f > t.position) {
              v = t.readUint();
              if (v) {
                if (v < t.position || v >= t.length) {
                  t.position -= 4;
                  break;
                }
                if (v < f) f = i + v;
              }
              c = n();
              c.pointer = v;
              c.loopPtr = t.readShort();
              c.length = t.readUshort() << 1;
              c.relative = t.readUshort();
              c.vibratoDelay = t.readUbyte();
              t.position++;
              c.vibratoSpeed = t.readUbyte();
              c.vibratoDepth = t.readUbyte();
              c.envelopeVol = t.readUbyte();
              c.attackSpeed = t.readUbyte();
              c.attackVol = t.readUbyte();
              c.decaySpeed = t.readUbyte();
              c.decayVol = t.readUbyte();
              c.sustainTime = t.readUbyte();
              c.releaseSpeed = t.readUbyte();
              c.releaseVol = t.readUbyte();
              c.arpeggio = new Int8Array(16);
              for (o = 0; o < 16; ++o) c.arpeggio[o] = t.readByte();
              c.arpeggioSpeed = t.readUbyte();
              c.type = t.readByte();
              c.pulseRateNeg = t.readByte();
              c.pulseRatePos = t.readUbyte();
              c.pulseSpeed = t.readUbyte();
              c.pulsePosL = t.readUbyte();
              c.pulsePosH = t.readUbyte();
              c.pulseDelay = t.readUbyte();
              c.synchro = t.readUbyte();
              c.blendRate = t.readUbyte();
              c.blendDelay = t.readUbyte();
              c.pulseCounter = t.readUbyte();
              c.blendCounter = t.readUbyte();
              c.arpeggioLimit = t.readUbyte();
              t.position += 12;
              this.samples.push(c);
              if (!t.bytesAvailable) break;
            }
            if (f != 2147483647) {
              this.mixer.store(t, t.length - f);
              a = this.samples.length;
              for (o = 0; o < a; ++o) {
                c = this.samples[o];
                if (c.pointer) c.pointer -= i + f;
              }
            }
            f = this.mixer.memory.length;
            this.mixer.memory.length += 256;
            this.mixer.loopLen = 100;
            for (o = 0; o < 4; ++o) {
              this.voices[o].synth = f;
              f += 64;
            }
            t.position = s + 2210;
            a = t.readUint();
            f = t.readUint();
            t.position = i + f;
            this.patterns = e(new ArrayBuffer(a - f));
            t.readBytes(this.patterns, 0, a - f);
            f += i;
            t.position = s + 2197;
            this.lastSong = a = t.readUbyte();
            this.songs = [];
            this.songs.length = ++a;
            i = s + 2830;
            d = f - i;
            f = 0;
            for (o = 0; o < a; ++o) {
              p = r();
              p.tracks = [];
              for (u = 0; u < 4; ++u) {
                t.position = i + f;
                v = t.readUshort();
                if (u == 3 && o == a - 1) h = d;
                else h = t.readUshort();
                h = (h - v) >> 1;
                if (h > p.length) p.length = h;
                p.tracks[u] = new Uint32Array(h);
                t.position = i + v;
                for (l = 0; l < h; ++l) p.tracks[u][l] = t.readUshort();
                f += 2;
              }
              t.position = s + 2199 + o;
              p.speed = t.readUbyte();
              this.songs[o] = p;
            }
            t.clear();
            t = null;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              o,
              u,
              a,
              f = this.voices[3];
            while (f) {
              e = f.channel;
              i = 0;
              do {
                this.patterns.position = f.patternPos;
                u = f.sample;
                this.sampFlag = 0;
                if (!f.busy) {
                  f.busy = 1;
                  if (u.loopPtr == 0) {
                    e.pointer = this.mixer.loopPtr;
                    e.length = this.mixer.loopLen;
                  } else if (u.loopPtr > 0) {
                    e.pointer = u.type ? f.synth : u.pointer + u.loopPtr;
                    e.length = u.length - u.loopPtr;
                  }
                }
                if (--f.tick == 0) {
                  i = 2;
                  while (i > 1) {
                    a = this.patterns.readByte();
                    if (a < 0) {
                      switch (a) {
                        case -125:
                          f.sample = u =
                            this.samples[this.patterns.readUbyte()];
                          this.sampFlag = 1;
                          f.patternPos = this.patterns.position;
                          break;
                        case -126:
                          this.speed = this.patterns.readUbyte();
                          f.patternPos = this.patterns.position;
                          break;
                        case -127:
                          a = u ? u.relative : 428;
                          f.portaSpeed = this.patterns.readUbyte() * this.speed;
                          f.portaNote = this.patterns.readUbyte();
                          f.portaLimit = (s[f.portaNote] * a) >> 10;
                          f.portamento = 0;
                          f.portaDelay = this.patterns.readUbyte() * this.speed;
                          f.portaFlag = 1;
                          f.patternPos = this.patterns.position;
                          break;
                        case -124:
                          e.enabled = 0;
                          f.tick = this.speed;
                          f.busy = 1;
                          f.patternPos = this.patterns.position;
                          i = 0;
                          break;
                        case -128:
                          f.trackPos++;
                          while (1) {
                            a = this.song.tracks[f.index][f.trackPos];
                            if (a == 65535) {
                              this.mixer.complete = 1;
                            } else if (a > 32767) {
                              f.trackPos = (a ^ 32768) >> 1;
                              if (!this.loopSong) {
                                this.complete &= ~f.bitFlag;
                                if (!this.complete) this.mixer.complete = 1;
                              }
                            } else {
                              f.patternPos = a;
                              f.tick = 1;
                              i = 1;
                              break;
                            }
                          }
                          break;
                        default:
                          f.tick = this.speed * -a;
                          f.patternPos = this.patterns.position;
                          i = 0;
                          break;
                      }
                    } else {
                      i = 0;
                      f.patternPos = this.patterns.position;
                      f.note = a;
                      f.arpeggioPos = 0;
                      f.vibratoFlag = -1;
                      f.vibrato = 0;
                      f.arpeggioSpeed = u.arpeggioSpeed;
                      f.vibratoDelay = u.vibratoDelay;
                      f.vibratoSpeed = u.vibratoSpeed;
                      f.vibratoDepth = u.vibratoDepth;
                      if (u.type == 1) {
                        if (this.sampFlag || u.synchro & 2) {
                          f.pulseCounter = u.pulseCounter;
                          f.pulseDelay = u.pulseDelay;
                          f.pulseDir = 0;
                          f.pulsePos = u.pulsePosL;
                          f.pulseSpeed = u.pulseSpeed;
                          t = f.synth;
                          r = t + u.pulsePosL;
                          for (; t < r; ++t)
                            this.mixer.memory[t] = u.pulseRateNeg;
                          r += u.length - u.pulsePosL;
                          for (; t < r; ++t)
                            this.mixer.memory[t] = u.pulseRatePos;
                        }
                        e.pointer = f.synth;
                      } else if (u.type == 2) {
                        f.blendCounter = u.blendCounter;
                        f.blendDelay = u.blendDelay;
                        f.blendDir = 0;
                        f.blendPos = 1;
                        t = u.pointer;
                        n = f.synth;
                        r = t + 31;
                        for (; t < r; ++t)
                          this.mixer.memory[n++] = this.mixer.memory[t];
                        e.pointer = f.synth;
                      } else {
                        e.pointer = u.pointer;
                      }
                      f.tick = this.speed;
                      f.busy = 0;
                      f.period = (s[f.note] * u.relative) >> 10;
                      f.volume = 0;
                      f.envelopePos = 0;
                      f.sustainTime = u.sustainTime;
                      e.length = u.length;
                      e.period = f.period;
                      e.volume = 0;
                      e.enabled = 1;
                      if (f.portaFlag) {
                        if (!f.portamento) {
                          f.portamento = f.period;
                          f.portaCounter = 1;
                          f.portaPeriod = f.portaLimit - f.period;
                        }
                      }
                    }
                  }
                } else if (f.tick == 1) {
                  a = (this.patterns.readAt(f.patternPos) - 160) & 255;
                  if (a > 127) e.enabled = 0;
                }
              } while (i > 0);
              if (!e.enabled) {
                f = f.next;
                continue;
              }
              a = f.note + u.arpeggio[f.arpeggioPos];
              if (--f.arpeggioSpeed == 0) {
                f.arpeggioSpeed = u.arpeggioSpeed;
                if (++f.arpeggioPos == u.arpeggioLimit) f.arpeggioPos = 0;
              }
              f.period = (s[a] * u.relative) >> 10;
              if (f.portaFlag) {
                if (f.portaDelay) {
                  f.portaDelay--;
                } else {
                  f.period += (f.portaCounter * f.portaPeriod) / f.portaSpeed;
                  if (++f.portaCounter > f.portaSpeed) {
                    f.note = f.portaNote;
                    f.portaFlag = 0;
                  }
                }
              }
              if (f.vibratoDelay) {
                f.vibratoDelay--;
              } else {
                if (f.vibratoFlag) {
                  if (f.vibratoFlag < 0) {
                    f.vibrato += f.vibratoSpeed;
                    if (f.vibrato == f.vibratoDepth)
                      f.vibratoFlag ^= 2147483648;
                  } else {
                    f.vibrato -= f.vibratoSpeed;
                    if (f.vibrato == 0) f.vibratoFlag ^= 2147483648;
                  }
                  if (f.vibrato == 0) f.vibratoFlag ^= 1;
                  if (f.vibratoFlag & 1) {
                    f.period += f.vibrato;
                  } else {
                    f.period -= f.vibrato;
                  }
                }
              }
              e.period = f.period;
              switch (f.envelopePos) {
                case 4:
                  break;
                case 0:
                  f.volume += u.attackSpeed;
                  if (f.volume >= u.attackVol) {
                    f.volume = u.attackVol;
                    f.envelopePos = 1;
                  }
                  break;
                case 1:
                  f.volume -= u.decaySpeed;
                  if (f.volume <= u.decayVol) {
                    f.volume = u.decayVol;
                    f.envelopePos = 2;
                  }
                  break;
                case 2:
                  if (f.sustainTime) {
                    f.sustainTime--;
                  } else {
                    f.envelopePos = 3;
                  }
                  break;
                case 3:
                  f.volume -= u.releaseSpeed;
                  if (f.volume <= u.releaseVol) {
                    f.volume = u.releaseVol;
                    f.envelopePos = 4;
                  }
                  break;
              }
              a = u.envelopeVol << 12;
              a >>= 8;
              a >>= 4;
              a *= f.volume;
              a >>= 8;
              a >>= 1;
              e.volume = a;
              if (u.type == 1) {
                if (f.pulseDelay) {
                  f.pulseDelay--;
                } else {
                  if (f.pulseSpeed) {
                    f.pulseSpeed--;
                  } else {
                    if (f.pulseCounter || !(u.synchro & 1)) {
                      f.pulseSpeed = u.pulseSpeed;
                      if (f.pulseDir & 4) {
                        while (1) {
                          if (f.pulsePos >= u.pulsePosL) {
                            i = 1;
                            break;
                          }
                          f.pulseDir &= -5;
                          f.pulsePos++;
                          f.pulseCounter--;
                          if (f.pulsePos <= u.pulsePosH) {
                            i = 2;
                            break;
                          }
                          f.pulseDir |= 4;
                          f.pulsePos--;
                          f.pulseCounter--;
                        }
                      } else {
                        while (1) {
                          if (f.pulsePos <= u.pulsePosH) {
                            i = 2;
                            break;
                          }
                          f.pulseDir |= 4;
                          f.pulsePos--;
                          f.pulseCounter--;
                          if (f.pulsePos >= u.pulsePosL) {
                            i = 1;
                            break;
                          }
                          f.pulseDir &= -5;
                          f.pulsePos++;
                          f.pulseCounter++;
                        }
                      }
                      o = f.synth + f.pulsePos;
                      if (i == 1) {
                        this.mixer.memory[o] = u.pulseRatePos;
                        f.pulsePos--;
                      } else {
                        this.mixer.memory[o] = u.pulseRateNeg;
                        f.pulsePos++;
                      }
                    }
                  }
                }
              } else if (u.type == 2) {
                if (f.blendDelay) {
                  f.blendDelay--;
                } else {
                  if (f.blendCounter || !(u.synchro & 4)) {
                    if (f.blendDir) {
                      if (f.blendPos != 1) {
                        f.blendPos--;
                      } else {
                        f.blendDir ^= 1;
                        f.blendCounter--;
                      }
                    } else {
                      if (f.blendPos != u.blendRate << 1) {
                        f.blendPos++;
                      } else {
                        f.blendDir ^= 1;
                        f.blendCounter--;
                      }
                    }
                    t = u.pointer;
                    n = f.synth;
                    r = t + 31;
                    o = r + 1;
                    for (; t < r; ++t) {
                      a = (f.blendPos * this.mixer.memory[o++]) >> u.blendRate;
                      this.mixer.memory[o++] = a + this.mixer.memory[t];
                    }
                  }
                }
              }
              f = f.next;
            }
          },
        },
      });
      o.voices[3] = t(3, 8);
      o.voices[3].next = o.voices[2] = t(2, 4);
      o.voices[2].next = o.voices[1] = t(1, 2);
      o.voices[1].next = o.voices[0] = t(0, 1);
      return Object.seal(o);
    }
    var s = [
      8192, 7728, 7296, 6888, 6504, 6136, 5792, 5464, 5160, 4872, 4600, 4336,
      4096, 3864, 3648, 3444, 3252, 3068, 2896, 2732, 2580, 2436, 2300, 2168,
      2048, 1932, 1824, 1722, 1626, 1534, 1448, 1366, 1290, 1218, 1150, 1084,
      1024, 966, 912, 861, 813, 767, 724, 683, 645, 609, 575, 542, 512, 483,
      456, 430, 406, 383, 362, 341, 322, 304, 287, 271, 256, 241, 228, 215, 203,
      191, 181, 170, 161, 152, 143, 135,
    ];
    window.neoart.FEPlayer = i;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        period: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        last: { value: 0, writable: true },
        slideCtr: { value: 0, writable: true },
        slideDir: { value: 0, writable: true },
        slideParam: { value: 0, writable: true },
        slidePeriod: { value: 0, writable: true },
        slideSpeed: { value: 0, writable: true },
        stepPeriod: { value: 0, writable: true },
        stepSpeed: { value: 0, writable: true },
        stepWanted: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.enabled = 0;
            this.period = 0;
            this.effect = 0;
            this.param = 0;
            this.volume = 0;
            this.last = 0;
            this.slideCtr = 0;
            this.slideDir = 0;
            this.slideParam = 0;
            this.slidePeriod = 0;
            this.slideSpeed = 0;
            this.stepPeriod = 0;
            this.stepSpeed = 0;
            this.stepWanted = 0;
          },
        },
      });
    }
    function t(t) {
      var f = c(t);
      Object.defineProperties(f, {
        id: { value: "FXPlayer" },
        standard: { value: 0, writable: true },
        track: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        delphine: { value: 0, writable: true },
        force: {
          set: function (e) {
            if (e < n) e = n;
            else if (e > s) e = s;
            this.version = e;
          },
        },
        ntsc: {
          set: function (e) {
            this.standard = e;
            this.frequency(e);
            e = e ? 20.44952532 : 20.637767904;
            e = (e * (this.sampleRate / 1e3)) / 120;
            this.mixer.samplesTick = ((this.tempo / 122) * e) >> 0;
          },
        },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.ntsc = this.standard;
            this.speed = 6;
            this.trackPos = 0;
            this.patternPos = 0;
            this.jumpFlag = 0;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[0];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var t = 0,
              o,
              f,
              l,
              c,
              h,
              p,
              d,
              v = 0,
              m;
            if (e.length < 1686) return;
            e.position = 60;
            f = e.readString(4);
            if (f != "SONG") {
              e.position = 124;
              f = e.readString(4);
              if (f != "SO31") return;
              if (e.length < 2350) return;
              h = 544;
              this.samples.length = c = 32;
              this.version = s;
            } else {
              h = 0;
              this.samples.length = c = 16;
              this.version = n;
            }
            this.tempo = e.readUshort();
            e.position = 0;
            for (o = 1; o < c; ++o) {
              m = e.readUint();
              if (m) {
                d = a();
                d.pointer = v;
                v += m;
                this.samples[o] = d;
              } else {
                this.samples[o] = null;
              }
            }
            e.position += 20;
            for (o = 1; o < c; ++o) {
              d = this.samples[o];
              if (!d) {
                e.position += 30;
                continue;
              }
              d.name = e.readString(22);
              d.length = e.readUshort() << 1;
              d.volume = e.readUshort();
              d.loop = e.readUshort();
              d.repeat = e.readUshort() << 1;
            }
            e.position = 530 + h;
            this.length = c = e.readUbyte();
            e.position++;
            for (o = 0; o < c; ++o) {
              m = e.readUbyte() << 8;
              this.track[o] = m;
              if (m > t) t = m;
            }
            if (h) h += 4;
            e.position = 660 + h;
            t += 256;
            this.patterns.length = t;
            c = this.samples.length;
            for (o = 0; o < t; ++o) {
              p = u();
              p.note = e.readShort();
              m = e.readUbyte();
              p.param = e.readUbyte();
              p.effect = m & 15;
              p.sample = m >> 4;
              this.patterns[o] = p;
              if (this.version == s) {
                if (p.note & 4096) {
                  p.sample += 16;
                  if (p.note > 0) p.note &= 61439;
                }
              } else {
                if (p.effect == 9 || p.note > 856) this.version = r;
                if (p.note < -3) this.version = i;
              }
              if (p.sample >= c || this.samples[p.sample] == null) p.sample = 0;
            }
            this.mixer.store(e, v);
            for (o = 1; o < c; ++o) {
              d = this.samples[o];
              if (!d) continue;
              if (d.loop) {
                d.loopPtr = d.pointer + d.loop;
              } else {
                d.loopPtr = this.mixer.memory.length;
                d.repeat = 2;
              }
              v = d.pointer + 4;
              for (l = d.pointer; l < v; ++l) this.mixer.memory[l] = 0;
            }
            d = a();
            d.pointer = d.loopPtr = this.mixer.memory.length;
            d.length = d.repeat = 2;
            this.samples[0] = d;
            e.position = t = this.delphine = 0;
            for (o = 0; o < 265; ++o) t += e.readUshort();
            switch (t) {
              case 172662:
              case 1391423:
              case 1458300:
              case 1706977:
              case 1920077:
              case 1920694:
              case 1677853:
              case 1931956:
              case 1926836:
              case 1385071:
              case 1720635:
              case 1714491:
              case 1731874:
              case 1437490:
                this.delphine = 1;
                break;
            }
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              i,
              s,
              u,
              a = this.voices[0];
            if (!this.tick) {
              u = this.track[this.trackPos] + this.patternPos;
              while (a) {
                e = a.channel;
                a.enabled = 0;
                i = this.patterns[u + a.index];
                a.period = i.note;
                a.effect = i.effect;
                a.param = i.param;
                if (i.note == -3) {
                  a.effect = 0;
                  a = a.next;
                  continue;
                }
                if (i.sample) {
                  s = a.sample = this.samples[i.sample];
                  a.volume = s.volume;
                  if (a.effect == 5) a.volume += a.param;
                  else if (a.effect == 6) a.volume -= a.param;
                  e.volume = a.volume;
                } else {
                  s = a.sample;
                }
                if (a.period) {
                  a.last = a.period;
                  a.slideSpeed = 0;
                  a.stepSpeed = 0;
                  a.enabled = 1;
                  e.enabled = 0;
                  switch (a.period) {
                    case -2:
                      e.volume = 0;
                      break;
                    case -4:
                      this.jumpFlag = 1;
                      break;
                    case -5:
                      break;
                    default:
                      e.pointer = s.pointer;
                      e.length = s.length;
                      if (this.delphine) e.period = a.period << 1;
                      else e.period = a.period;
                      break;
                  }
                  if (a.enabled) e.enabled = 1;
                  e.pointer = s.loopPtr;
                  e.length = s.repeat;
                }
                a = a.next;
              }
            } else {
              while (a) {
                e = a.channel;
                if (this.version == r && a.period == -3) {
                  a = a.next;
                  continue;
                }
                if (a.stepSpeed) {
                  a.stepPeriod += a.stepSpeed;
                  if (a.stepSpeed < 0) {
                    if (a.stepPeriod < a.stepWanted) {
                      a.stepPeriod = a.stepWanted;
                      if (this.version > r) a.stepSpeed = 0;
                    }
                  } else {
                    if (a.stepPeriod > a.stepWanted) {
                      a.stepPeriod = a.stepWanted;
                      if (this.version > r) a.stepSpeed = 0;
                    }
                  }
                  if (this.version > r) a.last = a.stepPeriod;
                  e.period = a.stepPeriod;
                } else {
                  if (a.slideSpeed) {
                    u = a.slideParam & 15;
                    if (u) {
                      if (++a.slideCtr == u) {
                        a.slideCtr = 0;
                        u = (a.slideParam << 4) << 3;
                        if (!a.slideDir) {
                          a.slidePeriod += 8;
                          e.period = a.slidePeriod;
                          u += a.slideSpeed;
                          if (u == a.slidePeriod) a.slideDir = 1;
                        } else {
                          a.slidePeriod -= 8;
                          e.period = a.slidePeriod;
                          u -= a.slideSpeed;
                          if (u == a.slidePeriod) a.slideDir = 0;
                        }
                      } else {
                        a = a.next;
                        continue;
                      }
                    }
                  }
                  u = 0;
                  switch (a.effect) {
                    case 0:
                      break;
                    case 1:
                      u = this.tick % 3;
                      t = 0;
                      if (u == 2) {
                        e.period = a.last;
                        a = a.next;
                        continue;
                      }
                      if (u == 1) u = a.param & 15;
                      else u = a.param >> 4;
                      while (a.last != o[t]) t++;
                      e.period = o[t + u];
                      break;
                    case 2:
                      u = a.param >> 4;
                      if (u) a.period += u;
                      else a.period -= a.param & 15;
                      e.period = a.period;
                      break;
                    case 3:
                      this.mixer.filter.active = 1;
                      break;
                    case 4:
                      this.mixer.filter.active = 0;
                      break;
                    case 8:
                      u = -1;
                    case 7:
                      a.stepSpeed = a.param & 15;
                      a.stepPeriod = this.version > r ? a.last : a.period;
                      if (u < 0) a.stepSpeed = -a.stepSpeed;
                      t = 0;
                      while (true) {
                        n = o[t];
                        if (n == a.stepPeriod) break;
                        if (n < 0) {
                          t = -1;
                          break;
                        } else t++;
                      }
                      if (t > -1) {
                        n = a.param >> 4;
                        if (u > -1) n = -n;
                        t += n;
                        if (t < 0) t = 0;
                        a.stepWanted = o[t];
                      } else a.stepWanted = a.period;
                      break;
                    case 9:
                      a.slideSpeed = a.slidePeriod = a.period;
                      a.slideParam = a.param;
                      a.slideDir = 0;
                      a.slideCtr = 0;
                      break;
                  }
                }
                a = a.next;
              }
            }
            if (++this.tick == this.speed) {
              this.tick = 0;
              this.patternPos += 4;
              if (this.patternPos == 256 || this.jumpFlag) {
                this.patternPos = this.jumpFlag = 0;
                if (++this.trackPos == this.length) {
                  this.trackPos = 0;
                  this.mixer.complete = 1;
                }
              }
            }
          },
        },
      });
      f.voices[0] = e(0);
      f.voices[0].next = f.voices[1] = e(1);
      f.voices[1].next = f.voices[2] = e(2);
      f.voices[2].next = f.voices[3] = e(3);
      f.track = new Uint16Array(128);
      return Object.seal(f);
    }
    var n = 1,
      r = 2,
      i = 3,
      s = 4,
      o = [
        1076, 1016, 960, 906, 856, 808, 762, 720, 678, 640, 604, 570, 538, 508,
        480, 453, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
        214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, 113, 113,
        113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
        113, 113, 113, 113, 113, 113, 113, 113, 113, 113, -1,
      ];
    window.neoart.FXPlayer = t;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        period: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
        volume1: { value: 0, writable: true },
        volume2: { value: 0, writable: true },
        handler: { value: 0, writable: true },
        portaDir: { value: 0, writable: true },
        portaPeriod: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        wavePos: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.enabled = 0;
            this.period = 0;
            this.effect = 0;
            this.param = 0;
            this.volume1 = 0;
            this.volume2 = 0;
            this.handler = 0;
            this.portaDir = 0;
            this.portaPeriod = 0;
            this.portaSpeed = 0;
            this.vibratoPos = 0;
            this.vibratoSpeed = 0;
            this.wavePos = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        finetune: { value: 0, writable: true },
        restart: { value: 0, writable: true },
        waveLen: { value: 0, writable: true },
        waves: { value: null, writable: true },
        volumes: { value: null, writable: true },
      });
      return Object.seal(e);
    }
    function n(n) {
      var o = c(n);
      Object.defineProperties(o, {
        id: { value: "HMPlayer" },
        track: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        restart: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.speed = 6;
            this.trackPos = 0;
            this.patternPos = 0;
            this.jumpFlag = 0;
            this.mixer.samplesTick = 884;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[0];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var n = 0,
              r = 0,
              i,
              s,
              o,
              a = 0,
              f,
              l,
              c,
              h = 0,
              p;
            if (e.length < 2106) return;
            e.position = 1080;
            s = e.readString(4);
            if (s != "FEST") return;
            e.position = 950;
            this.length = e.readUbyte();
            this.restart = e.readUbyte();
            for (i = 0; i < 128; ++i) this.track[i] = e.readUbyte();
            e.position = 0;
            this.title = e.readString(20);
            this.version = 1;
            for (i = 1; i < 32; ++i) {
              this.samples[i] = null;
              s = e.readString(4);
              if (s == "Mupp") {
                p = e.readUbyte();
                n = p - r++;
                for (o = 0; o < 128; ++o)
                  if (this.track[o] && this.track[o] >= n) this.track[o]--;
                c = t();
                c.name = s;
                c.length = c.repeat = 32;
                c.restart = e.readUbyte();
                c.waveLen = e.readUbyte();
                e.position += 17;
                c.finetune = e.readByte();
                c.volume = e.readUbyte();
                f = e.position + 4;
                p = 1084 + (p << 10);
                e.position = p;
                c.pointer = this.mixer.memory.length;
                c.waves = new Uint16Array(64);
                c.volumes = new Uint8Array(64);
                this.mixer.store(e, 896);
                for (o = 0; o < 64; ++o) c.waves[o] = e.readUbyte() << 5;
                for (o = 0; o < 64; ++o) c.volumes[o] = e.readUbyte() & 127;
                e.position = p;
                e.writeInt(1718382436);
                e.position = f;
                a += 896;
              } else {
                s = s.substr(0, 2);
                if (s == "El") e.position += 18;
                else {
                  e.position -= 4;
                  s = e.readString(22);
                }
                p = e.readUshort();
                if (!p) {
                  e.position += 6;
                  continue;
                }
                c = t();
                c.name = s;
                c.pointer = h;
                c.length = p << 1;
                c.finetune = e.readByte();
                c.volume = e.readUbyte();
                c.loop = e.readUshort() << 1;
                c.repeat = e.readUshort() << 1;
                h += c.length;
              }
              this.samples[i] = c;
            }
            for (i = 0; i < 128; ++i) {
              p = this.track[i] << 8;
              this.track[i] = p;
              if (p > r) r = p;
            }
            e.position = 1084;
            r += 256;
            this.patterns.length = r;
            for (i = 0; i < r; ++i) {
              p = e.readUint();
              while (p == 1718382436) {
                e.position += 1020;
                p = e.readUint();
              }
              l = u();
              l.note = (p >> 16) & 4095;
              l.sample = ((p >> 24) & 240) | ((p >> 12) & 15);
              l.effect = (p >> 8) & 15;
              l.param = p & 255;
              if (l.sample > 31 || !this.samples[l.sample]) l.sample = 0;
              this.patterns[i] = l;
            }
            this.mixer.store(e, h);
            for (i = 1; i < 32; ++i) {
              c = this.samples[i];
              if (c == null || c.name == "Mupp") continue;
              c.pointer += a;
              if (c.loop) {
                c.loopPtr = c.pointer + c.loop;
                c.length = c.loop + c.repeat;
              } else {
                c.loopPtr = this.mixer.memory.length;
                c.repeat = 2;
              }
              h = c.pointer + 4;
              for (o = c.pointer; o < h; ++o) this.mixer.memory[o] = 0;
            }
            c = t();
            c.pointer = c.loopPtr = this.mixer.memory.length;
            c.length = c.repeat = 2;
            this.samples[0] = c;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.voices[0];
            if (!this.tick) {
              t = this.track[this.trackPos] + this.patternPos;
              while (s) {
                e = s.channel;
                s.enabled = 0;
                n = this.patterns[t + s.index];
                s.effect = n.effect;
                s.param = n.param;
                if (n.sample) {
                  r = s.sample = this.samples[n.sample];
                  s.volume2 = r.volume;
                  if (r.name == "Mupp") {
                    r.loopPtr = r.pointer + r.waves[0];
                    s.handler = 1;
                    s.volume1 = r.volumes[0];
                  } else {
                    s.handler = 0;
                    s.volume1 = 64;
                  }
                } else {
                  r = s.sample;
                }
                if (n.note) {
                  if (s.effect == 3 || s.effect == 5) {
                    if (n.note < s.period) {
                      s.portaDir = 1;
                      s.portaPeriod = n.note;
                    } else if (n.note > s.period) {
                      s.portaDir = 0;
                      s.portaPeriod = n.note;
                    } else {
                      s.portaPeriod = 0;
                    }
                  } else {
                    s.period = n.note;
                    s.vibratoPos = 0;
                    s.wavePos = 0;
                    s.enabled = 1;
                    e.enabled = 0;
                    i = (s.period * r.finetune) >> 8;
                    e.period = s.period + i;
                    if (s.handler) {
                      e.pointer = r.loopPtr;
                      e.length = r.repeat;
                    } else {
                      e.pointer = r.pointer;
                      e.length = r.length;
                    }
                  }
                }
                switch (s.effect) {
                  case 11:
                    this.trackPos = s.param - 1;
                    this.jumpFlag = 1;
                    break;
                  case 12:
                    s.volume2 = s.param;
                    if (s.volume2 > 64) s.volume2 = 64;
                    break;
                  case 13:
                    this.jumpFlag = 1;
                    break;
                  case 14:
                    this.mixer.filter.active = s.param ^ 1;
                    break;
                  case 15:
                    i = s.param;
                    if (i < 1) i = 1;
                    else if (i > 31) i = 31;
                    this.speed = i;
                    this.tick = 0;
                    break;
                }
                if (!n.note) this.effects(s);
                this.handler(s);
                if (s.enabled) e.enabled = 1;
                e.pointer = r.loopPtr;
                e.length = r.repeat;
                s = s.next;
              }
            } else {
              while (s) {
                this.effects(s);
                this.handler(s);
                r = s.sample;
                s.channel.pointer = r.loopPtr;
                s.channel.length = r.repeat;
                s = s.next;
              }
            }
            if (++this.tick == this.speed) {
              this.tick = 0;
              this.patternPos += 4;
              if (this.patternPos == 256 || this.jumpFlag) {
                this.patternPos = this.jumpFlag = 0;
                this.trackPos = ++this.trackPos & 127;
                if (this.trackPos == this.length) {
                  this.trackPos = this.restart;
                  this.mixer.complete = 1;
                }
              }
            }
          },
        },
        effects: {
          value: function (e) {
            var t = e.channel,
              n,
              o,
              u = e.period & 4095,
              a,
              f;
            if (e.effect || e.param) {
              switch (e.effect) {
                case 0:
                  f = this.tick % 3;
                  if (!f) break;
                  if (f == 1) f = e.param >> 4;
                  else f = e.param & 15;
                  o = 37 - f;
                  for (n = 0; n < o; ++n) {
                    if (u >= i[n]) {
                      u = i[n + f];
                      break;
                    }
                  }
                  break;
                case 1:
                  e.period -= e.param;
                  if (e.period < 113) e.period = 113;
                  u = e.period;
                  break;
                case 2:
                  e.period += e.param;
                  if (e.period > 856) e.period = 856;
                  u = e.period;
                  break;
                case 3:
                case 5:
                  if (e.effect == 5) a = 1;
                  else if (e.param) {
                    e.portaSpeed = e.param;
                    e.param = 0;
                  }
                  if (e.portaPeriod) {
                    if (e.portaDir) {
                      e.period -= e.portaSpeed;
                      if (e.period < e.portaPeriod) {
                        e.period = e.portaPeriod;
                        e.portaPeriod = 0;
                      }
                    } else {
                      e.period += e.portaSpeed;
                      if (e.period > e.portaPeriod) {
                        e.period = e.portaPeriod;
                        e.portaPeriod = 0;
                      }
                    }
                  }
                  u = e.period;
                  break;
                case 4:
                case 6:
                  if (e.effect == 6) a = 1;
                  else if (e.param) e.vibratoSpeed = e.param;
                  f = s[(e.vibratoPos >> 2) & 31];
                  f = ((e.vibratoSpeed & 15) * f) >> 7;
                  if (e.vibratoPos > 127) u -= f;
                  else u += f;
                  f = (e.vibratoSpeed >> 2) & 60;
                  e.vibratoPos = (e.vibratoPos + f) & 255;
                  break;
                case 7:
                  f = r[(e.vibratoPos & 15) + ((e.param & 15) << 4)];
                  e.vibratoPos++;
                  for (n = 0; n < 37; ++n) if (u >= i[n]) break;
                  f += n;
                  if (f > 35) f -= 12;
                  u = i[f];
                  break;
                case 10:
                  a = 1;
                  break;
              }
            }
            t.period = u + ((u * e.sample.finetune) >> 8);
            if (a) {
              f = e.param >> 4;
              if (f) e.volume2 += f;
              else e.volume2 -= e.param & 15;
              if (e.volume2 > 64) e.volume2 = 64;
              else if (e.volume2 < 0) e.volume2 = 0;
            }
          },
        },
        handler: {
          value: function (e) {
            var t;
            if (e.handler) {
              t = e.sample;
              t.loopPtr = t.pointer + t.waves[e.wavePos];
              e.volume1 = t.volumes[e.wavePos];
              if (++e.wavePos > t.waveLen) {
                e.wavePos = t.restart;
              }
            }
            e.channel.volume = (e.volume1 * e.volume2) >> 6;
          },
        },
      });
      o.voices[0] = e(0);
      o.voices[0].next = o.voices[1] = e(1);
      o.voices[1].next = o.voices[2] = e(2);
      o.voices[2].next = o.voices[3] = e(3);
      o.track = new Uint16Array(128);
      return Object.seal(o);
    }
    var r = [
        0, 3, 7, 12, 15, 12, 7, 3, 0, 3, 7, 12, 15, 12, 7, 3, 0, 4, 7, 12, 16,
        12, 7, 4, 0, 4, 7, 12, 16, 12, 7, 4, 0, 3, 8, 12, 15, 12, 8, 3, 0, 3, 8,
        12, 15, 12, 8, 3, 0, 4, 8, 12, 16, 12, 8, 4, 0, 4, 8, 12, 16, 12, 8, 4,
        0, 5, 8, 12, 17, 12, 8, 5, 0, 5, 8, 12, 17, 12, 8, 5, 0, 5, 9, 12, 17,
        12, 9, 5, 0, 5, 9, 12, 17, 12, 9, 5, 12, 0, 7, 0, 3, 0, 7, 0, 12, 0, 7,
        0, 3, 0, 7, 0, 12, 0, 7, 0, 4, 0, 7, 0, 12, 0, 7, 0, 4, 0, 7, 0, 0, 3,
        7, 3, 7, 12, 7, 12, 15, 12, 7, 12, 7, 3, 7, 3, 0, 4, 7, 4, 7, 12, 7, 12,
        16, 12, 7, 12, 7, 4, 7, 4, 31, 27, 24, 19, 15, 12, 7, 3, 0, 3, 7, 12,
        15, 19, 24, 27, 31, 28, 24, 19, 16, 12, 7, 4, 0, 4, 7, 12, 16, 19, 24,
        28, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 24,
        12, 0, 12, 24, 12, 0, 12, 24, 12, 0, 12, 24, 12, 0, 3, 0, 3, 0, 3, 0, 3,
        0, 3, 0, 3, 0, 3, 0, 3, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4,
      ],
      i = [
        856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
        381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 0,
      ],
      s = [
        0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250,
        253, 255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74,
        49, 24,
      ];
    window.neoart.HMPlayer = n;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        cosoCounter: { value: 0, writable: true },
        cosoSpeed: { value: 0, writable: true },
        trackPtr: { value: 0, writable: true },
        trackPos: { value: 0, writable: true },
        trackTransp: { value: 0, writable: true },
        patternPtr: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        frqseqPtr: { value: 0, writable: true },
        frqseqPos: { value: 0, writable: true },
        volseqPtr: { value: 0, writable: true },
        volseqPos: { value: 0, writable: true },
        sample: { value: 0, writable: true },
        loopPtr: { value: 0, writable: true },
        repeat: { value: 0, writable: true },
        tick: { value: 0, writable: true },
        note: { value: 0, writable: true },
        transpose: { value: 0, writable: true },
        info: { value: 0, writable: true },
        infoPrev: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        volCounter: { value: 0, writable: true },
        volSpeed: { value: 0, writable: true },
        volSustain: { value: 0, writable: true },
        volTransp: { value: 0, writable: true },
        volFade: { value: 0, writable: true },
        portaDelta: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        vibDelay: { value: 0, writable: true },
        vibDelta: { value: 0, writable: true },
        vibDepth: { value: 0, writable: true },
        vibSpeed: { value: 0, writable: true },
        slide: { value: 0, writable: true },
        sldActive: { value: 0, writable: true },
        sldDone: { value: 0, writable: true },
        sldCounter: { value: 0, writable: true },
        sldSpeed: { value: 0, writable: true },
        sldDelta: { value: 0, writable: true },
        sldPointer: { value: 0, writable: true },
        sldLen: { value: 0, writable: true },
        sldEnd: { value: 0, writable: true },
        sldLoopPtr: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.enabled = 0;
            this.cosoCounter = 0;
            this.cosoSpeed = 0;
            this.trackPtr = 0;
            this.trackPos = 12;
            this.trackTransp = 0;
            this.patternPtr = 0;
            this.patternPos = 0;
            this.frqseqPtr = 0;
            this.frqseqPos = 0;
            this.volseqPtr = 0;
            this.volseqPos = 0;
            this.sample = -1;
            this.loopPtr = 0;
            this.repeat = 0;
            this.tick = 0;
            this.note = 0;
            this.transpose = 0;
            this.info = 0;
            this.infoPrev = 0;
            this.volume = 0;
            this.volCounter = 1;
            this.volSpeed = 1;
            this.volSustain = 0;
            this.volTransp = 0;
            this.volFade = 100;
            this.portaDelta = 0;
            this.vibrato = 0;
            this.vibDelay = 0;
            this.vibDelta = 0;
            this.vibDepth = 0;
            this.vibSpeed = 0;
            this.slide = 0;
            this.sldActive = 0;
            this.sldDone = 0;
            this.sldCounter = 0;
            this.sldSpeed = 0;
            this.sldDelta = 0;
            this.sldPointer = 0;
            this.sldLen = 0;
            this.sldEnd = 0;
            this.sldLoopPtr = 0;
          },
        },
      });
    }
    function t() {
      return Object.create(null, {
        pointer: { value: 0, writable: true },
        speed: { value: 0, writable: true },
        length: { value: 0, writable: true },
      });
    }
    function n(n) {
      var i = c(n);
      Object.defineProperties(i, {
        id: { value: "JHPlayer" },
        songs: { value: [], writable: true },
        samples: { value: [], writable: true },
        stream: { value: null, writable: true },
        base: { value: 0, writable: true },
        patterns: { value: 0, writable: true },
        patternLen: { value: 0, writable: true },
        periods: { value: 0, writable: true },
        frqseqs: { value: 0, writable: true },
        volseqs: { value: 0, writable: true },
        samplesData: { value: 0, writable: true },
        song: { value: null, writable: true },
        voices: { value: [], writable: true },
        coso: { value: 0, writable: true },
        variant: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.song = this.songs[this.playSong];
            this.speed = this.song.speed;
            this.tick = this.coso || this.variant > 1 ? 1 : this.speed;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.trackPtr = this.song.pointer + e.index * 3;
              if (this.coso) {
                e.trackPos = 0;
                e.patternPos = 8;
              } else {
                this.stream.position = e.trackPtr;
                e.patternPtr =
                  this.patterns + this.stream.readUbyte() * this.patternLen;
                e.trackTransp = this.stream.readByte();
                e.volTransp = this.stream.readByte();
                e.frqseqPtr = this.base;
                e.volseqPtr = this.base;
              }
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var n,
              r,
              i,
              s,
              o,
              u,
              f,
              l,
              c,
              h = 0;
            this.base = this.periods = 0;
            this.coso = e.readString(4) == "COSO";
            if (this.coso) {
              for (r = 0; r < 7; ++r) h += e.readInt();
              if (h == 16942) {
                e.position = 47;
                h += e.readUbyte();
              }
              switch (h) {
                case 22666:
                case 18842:
                case 30012:
                case 22466:
                case 3546:
                  this.variant = 1;
                  break;
                case 16948:
                case 18332:
                case 13698:
                  this.variant = 2;
                  break;
                case 18546:
                case 13926:
                case 8760:
                case 17242:
                case 11394:
                case 14494:
                case 14392:
                case 13576:
                case 6520:
                  this.variant = 3;
                  break;
                default:
                  this.variant = 4;
              }
              this.version = 2;
              e.position = 4;
              this.frqseqs = e.readUint();
              this.volseqs = e.readUint();
              this.patterns = e.readUint();
              c = e.readUint();
              l = e.readUint();
              n = e.readUint();
              this.samplesData = e.readUint();
              e.position = 0;
              e.writeInt(16777216);
              e.writeInt(225);
              e.writeShort(65535);
              s = (this.samplesData - n) / 10 - 1;
              this.lastSong = (n - l) / 6;
            } else {
              while (e.bytesAvailable > 12) {
                h = e.readUshort();
                switch (h) {
                  case 576:
                    h = e.readUshort();
                    if (h == 127) {
                      e.position += 2;
                      this.periods = e.position + e.readUshort();
                    }
                    break;
                  case 28674:
                  case 28675:
                    this.channels = h & 255;
                    h = e.readUshort();
                    if (h == 30208) h = e.readUshort();
                    if (h == 16890) {
                      e.position += 4;
                      this.base = e.position + e.readUshort();
                    }
                    break;
                  case 21574:
                    h = e.readUshort();
                    if (h == 19800) {
                      i = e.position - 4;
                      e.position = e.length;
                    }
                    break;
                }
              }
              if (!i || !this.base || !this.periods) return;
              this.version = 1;
              e.position = i + 4;
              this.frqseqs = o = i + 32;
              h = e.readUshort();
              this.volseqs = o += ++h << 6;
              h = e.readUshort();
              this.patterns = o += ++h << 6;
              h = e.readUshort();
              e.position += 2;
              this.patternLen = e.readUshort();
              c = o += ++h * this.patternLen;
              e.position -= 4;
              h = e.readUshort();
              l = o += ++h * 12;
              e.position = i + 16;
              this.lastSong = e.readUshort();
              n = o += ++this.lastSong * 6;
              s = e.readUshort();
              this.samplesData = o + s * 30;
            }
            e.position = n;
            this.samples = [];
            h = 0;
            for (r = 0; r < s; ++r) {
              u = a();
              if (!this.coso) u.name = e.readString(18);
              u.pointer = e.readUint();
              u.length = e.readUshort() << 1;
              if (!this.coso) u.volume = e.readUshort();
              u.loopPtr = e.readUshort() + u.pointer;
              u.repeat = e.readUshort() << 1;
              if (u.loopPtr & 1) u.loopPtr--;
              h += u.length;
              this.samples[r] = u;
            }
            e.position = this.samplesData;
            this.mixer.store(e, h);
            e.position = l;
            this.songs = [];
            h = 0;
            for (r = 0; r < this.lastSong; ++r) {
              f = t();
              f.pointer = e.readUshort();
              f.length = e.readUshort() - f.pointer + 1;
              f.speed = e.readUshort();
              f.pointer = f.pointer * 12 + c;
              f.length *= 12;
              if (f.length > 12) this.songs[h++] = f;
            }
            this.lastSong = this.songs.length - 1;
            if (!this.coso) {
              e.position = 0;
              this.variant = 1;
              while (e.position < i) {
                h = e.readUshort();
                if (h == 45116 || h == 3072) {
                  h = e.readUshort();
                  if (h == 229 || h == 230 || h == 233) {
                    this.variant = 2;
                    break;
                  }
                } else if (h == 20219) {
                  this.variant = 3;
                  break;
                }
              }
            }
            this.stream = e;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              i,
              s,
              o,
              u,
              a = this.voices[0];
            if (--this.tick == 0) {
              this.tick = this.speed;
              while (a) {
                e = a.channel;
                if (this.coso) {
                  if (--a.cosoCounter < 0) {
                    a.cosoCounter = a.cosoSpeed;
                    do {
                      this.stream.position = a.patternPos;
                      do {
                        t = 0;
                        u = this.stream.readByte();
                        if (u == -1) {
                          if (a.trackPos == this.song.length) {
                            a.trackPos = 0;
                            this.mixer.complete = 1;
                          }
                          this.stream.position = a.trackPtr + a.trackPos;
                          u = this.stream.readUbyte();
                          a.trackTransp = this.stream.readByte();
                          i = this.stream.readAt(this.stream.position);
                          if (this.variant > 3 && i > 127) {
                            s = (i >> 4) & 15;
                            i &= 15;
                            if (s == 15) {
                              s = 100;
                              if (i) {
                                s = 15 - i + 1;
                                s <<= 1;
                                i = s;
                                s <<= 1;
                                s += i;
                              }
                              a.volFade = s;
                            } else if (s == 8) {
                              this.mixer.complete = 1;
                            } else if (s == 14) {
                              this.speed = i;
                            }
                          } else {
                            a.volTransp = this.stream.readByte();
                          }
                          this.stream.position = this.patterns + (u << 1);
                          a.patternPos = this.stream.readUshort();
                          a.trackPos += 12;
                          t = 1;
                        } else if (u == -2) {
                          a.cosoCounter = a.cosoSpeed = this.stream.readUbyte();
                          t = 3;
                        } else if (u == -3) {
                          a.cosoCounter = a.cosoSpeed = this.stream.readUbyte();
                          a.patternPos = this.stream.position;
                        } else {
                          a.note = u;
                          a.info = this.stream.readByte();
                          if (a.info & 224) a.infoPrev = this.stream.readByte();
                          a.patternPos = this.stream.position;
                          a.portaDelta = 0;
                          if (u >= 0) {
                            if (this.variant == 1) e.enabled = 0;
                            u = (a.info & 31) + a.volTransp;
                            this.stream.position = this.volseqs + (u << 1);
                            this.stream.position = this.stream.readUshort();
                            a.volCounter = a.volSpeed = this.stream.readUbyte();
                            a.volSustain = 0;
                            u = this.stream.readByte();
                            a.vibSpeed = this.stream.readByte();
                            a.vibrato = 64;
                            a.vibDepth = a.vibDelta = this.stream.readByte();
                            a.vibDelay = this.stream.readUbyte();
                            a.volseqPtr = this.stream.position;
                            a.volseqPos = 0;
                            if (u != -128) {
                              if (this.variant > 1 && a.info & 64)
                                u = a.infoPrev;
                              this.stream.position = this.frqseqs + (u << 1);
                              a.frqseqPtr = this.stream.readUshort();
                              a.frqseqPos = 0;
                              a.tick = 0;
                            }
                          }
                        }
                      } while (t > 2);
                    } while (t > 0);
                  }
                } else {
                  this.stream.position = a.patternPtr + a.patternPos;
                  u = this.stream.readByte();
                  if (a.patternPos == this.patternLen || (u & 127) == 1) {
                    if (a.trackPos == this.song.length) {
                      a.trackPos = 0;
                      this.mixer.complete = 1;
                    }
                    this.stream.position = a.trackPtr + a.trackPos;
                    u = this.stream.readUbyte();
                    a.trackTransp = this.stream.readByte();
                    a.volTransp = this.stream.readByte();
                    if (a.volTransp == -128) this.mixer.complete = 1;
                    a.patternPtr = this.patterns + u * this.patternLen;
                    a.patternPos = 0;
                    a.trackPos += 12;
                    this.stream.position = a.patternPtr;
                    u = this.stream.readByte();
                  }
                  if (u & 127) {
                    a.note = u & 127;
                    a.portaDelta = 0;
                    i = this.stream.position;
                    if (!a.patternPos) this.stream.position += this.patternLen;
                    this.stream.position -= 2;
                    a.infoPrev = this.stream.readByte();
                    this.stream.position = i;
                    a.info = this.stream.readByte();
                    if (u >= 0) {
                      if (this.variant == 1) e.enabled = 0;
                      u = (a.info & 31) + a.volTransp;
                      this.stream.position = this.volseqs + (u << 6);
                      a.volCounter = a.volSpeed = this.stream.readUbyte();
                      a.volSustain = 0;
                      u = this.stream.readByte();
                      a.vibSpeed = this.stream.readByte();
                      a.vibrato = 64;
                      a.vibDepth = a.vibDelta = this.stream.readByte();
                      a.vibDelay = this.stream.readUbyte();
                      a.volseqPtr = this.stream.position;
                      a.volseqPos = 0;
                      if (this.variant > 1 && a.info & 64) u = a.infoPrev;
                      a.frqseqPtr = this.frqseqs + (u << 6);
                      a.frqseqPos = 0;
                      a.tick = 0;
                    }
                  }
                  a.patternPos += 2;
                }
                a = a.next;
              }
              a = this.voices[0];
            }
            while (a) {
              e = a.channel;
              a.enabled = 0;
              do {
                t = 0;
                if (a.tick) {
                  a.tick--;
                } else {
                  this.stream.position = a.frqseqPtr + a.frqseqPos;
                  do {
                    u = this.stream.readByte();
                    if (u == -31) break;
                    t = 3;
                    if (this.variant == 3 && this.coso) {
                      if (u == -27) {
                        u = -30;
                      } else if (u == -26) {
                        u = -28;
                      }
                    }
                    switch (u) {
                      case -32:
                        a.frqseqPos = this.stream.readUbyte() & 63;
                        this.stream.position = a.frqseqPtr + a.frqseqPos;
                        break;
                      case -30:
                        o = this.samples[this.stream.readUbyte()];
                        a.sample = -1;
                        a.loopPtr = o.loopPtr;
                        a.repeat = o.repeat;
                        a.enabled = 1;
                        e.enabled = 0;
                        e.pointer = o.pointer;
                        e.length = o.length;
                        a.volseqPos = 0;
                        a.volCounter = 1;
                        a.slide = 0;
                        a.frqseqPos += 2;
                        break;
                      case -29:
                        a.vibSpeed = this.stream.readByte();
                        a.vibDepth = this.stream.readByte();
                        a.frqseqPos += 3;
                        break;
                      case -28:
                        o = this.samples[this.stream.readUbyte()];
                        a.loopPtr = o.loopPtr;
                        a.repeat = o.repeat;
                        e.pointer = o.pointer;
                        e.length = o.length;
                        a.slide = 0;
                        a.frqseqPos += 2;
                        break;
                      case -27:
                        if (this.variant < 2) break;
                        o = this.samples[this.stream.readUbyte()];
                        e.enabled = 0;
                        a.enabled = 1;
                        if (this.variant == 2) {
                          i = this.stream.readUbyte() * o.length;
                          a.loopPtr = o.loopPtr + i;
                          a.repeat = o.repeat;
                          e.pointer = o.pointer + i;
                          e.length = o.length;
                          a.frqseqPos += 3;
                        } else {
                          a.sldPointer = o.pointer;
                          a.sldEnd = o.pointer + o.length;
                          u = this.stream.readUshort();
                          if (u == 65535) {
                            a.sldLoopPtr = o.length;
                          } else {
                            a.sldLoopPtr = u << 1;
                          }
                          a.sldLen = this.stream.readUshort() << 1;
                          a.sldDelta = this.stream.readShort() << 1;
                          a.sldActive = 0;
                          a.sldCounter = 0;
                          a.sldSpeed = this.stream.readUbyte();
                          a.slide = 1;
                          a.sldDone = 0;
                          a.frqseqPos += 9;
                        }
                        a.volseqPos = 0;
                        a.volCounter = 1;
                        break;
                      case -26:
                        if (this.variant < 3) break;
                        a.sldLen = this.stream.readUshort() << 1;
                        a.sldDelta = this.stream.readShort() << 1;
                        a.sldActive = 0;
                        a.sldCounter = 0;
                        a.sldSpeed = this.stream.readUbyte();
                        a.sldDone = 0;
                        a.frqseqPos += 6;
                        break;
                      case -25:
                        if (this.variant == 1) {
                          a.frqseqPtr =
                            this.frqseqs + (this.stream.readUbyte() << 6);
                          a.frqseqPos = 0;
                          this.stream.position = a.frqseqPtr;
                          t = 3;
                        } else {
                          u = this.stream.readUbyte();
                          if (u != a.sample) {
                            o = this.samples[u];
                            a.sample = u;
                            a.loopPtr = o.loopPtr;
                            a.repeat = o.repeat;
                            a.enabled = 1;
                            e.enabled = 0;
                            e.pointer = o.pointer;
                            e.length = o.length;
                          }
                          a.volseqPos = 0;
                          a.volCounter = 1;
                          a.slide = 0;
                          a.frqseqPos += 2;
                        }
                        break;
                      case -24:
                        a.tick = this.stream.readUbyte();
                        a.frqseqPos += 2;
                        t = 1;
                        break;
                      case -23:
                        if (this.variant < 2) break;
                        o = this.samples[this.stream.readUbyte()];
                        a.sample = -1;
                        a.enabled = 1;
                        s = this.stream.readUbyte();
                        i = this.stream.position;
                        e.enabled = 0;
                        this.stream.position = this.samplesData + o.pointer + 4;
                        u =
                          this.stream.readUshort() * 24 +
                          (this.stream.readUshort() << 2);
                        this.stream.position += s * 24;
                        a.loopPtr = this.stream.readUint() & 4294967294;
                        e.length =
                          (this.stream.readUint() & 4294967294) - a.loopPtr;
                        a.loopPtr += o.pointer + u + 8;
                        e.pointer = a.loopPtr;
                        a.repeat = 2;
                        this.stream.position = i;
                        i = a.loopPtr + 1;
                        this.mixer.memory[i] = this.mixer.memory[a.loopPtr];
                        a.volseqPos = 0;
                        a.volCounter = 1;
                        a.slide = 0;
                        a.frqseqPos += 3;
                        break;
                      default:
                        a.transpose = u;
                        a.frqseqPos++;
                        t = 0;
                    }
                  } while (t > 2);
                }
              } while (t > 0);
              if (a.slide) {
                if (!a.sldDone) {
                  if (--a.sldCounter < 0) {
                    a.sldCounter = a.sldSpeed;
                    if (a.sldActive) {
                      u = a.sldLoopPtr + a.sldDelta;
                      if (u < 0) {
                        a.sldDone = 1;
                        u = a.sldLoopPtr - a.sldDelta;
                      } else {
                        i = a.sldPointer + a.sldLen + u;
                        if (i > a.sldEnd) {
                          a.sldDone = 1;
                          u = a.sldLoopPtr - a.sldDelta;
                        }
                      }
                      a.sldLoopPtr = u;
                    } else {
                      a.sldActive = 1;
                    }
                    a.loopPtr = a.sldPointer + a.sldLoopPtr;
                    a.repeat = a.sldLen;
                    e.pointer = a.loopPtr;
                    e.length = a.repeat;
                  }
                }
              }
              do {
                t = 0;
                if (a.volSustain) {
                  a.volSustain--;
                } else {
                  if (--a.volCounter) break;
                  a.volCounter = a.volSpeed;
                  do {
                    this.stream.position = a.volseqPtr + a.volseqPos;
                    u = this.stream.readByte();
                    if (u <= -25 && u >= -31) break;
                    switch (u) {
                      case -24:
                        a.volSustain = this.stream.readUbyte();
                        a.volseqPos += 2;
                        t = 1;
                        break;
                      case -32:
                        a.volseqPos = (this.stream.readUbyte() & 63) - 5;
                        t = 3;
                        break;
                      default:
                        a.volume = u;
                        a.volseqPos++;
                        t = 0;
                    }
                  } while (t > 2);
                }
              } while (t > 0);
              u = a.transpose;
              if (u >= 0) u += a.note + a.trackTransp;
              u &= 127;
              if (this.coso) {
                if (u > 83) u = 0;
                n = r[u];
                u <<= 1;
              } else {
                u <<= 1;
                this.stream.position = this.periods + u;
                n = this.stream.readUshort();
              }
              if (a.vibDelay) {
                a.vibDelay--;
              } else {
                if (this.variant > 3) {
                  if (a.vibrato & 32) {
                    u = a.vibDelta + a.vibSpeed;
                    if (u > a.vibDepth) {
                      a.vibrato &= ~32;
                      u = a.vibDepth;
                    }
                  } else {
                    u = a.vibDelta - a.vibSpeed;
                    if (u < 0) {
                      a.vibrato |= 32;
                      u = 0;
                    }
                  }
                  a.vibDelta = u;
                  u = (u - (a.vibDepth >> 1)) * n;
                  n += u >> 10;
                } else if (this.variant > 2) {
                  u = a.vibSpeed;
                  if (u < 0) {
                    u &= 127;
                    a.vibrato ^= 1;
                  }
                  if (!(a.vibrato & 1)) {
                    if (a.vibrato & 32) {
                      a.vibDelta += u;
                      i = a.vibDepth << 1;
                      if (a.vibDelta > i) {
                        a.vibrato &= ~32;
                        a.vibDelta = i;
                      }
                    } else {
                      a.vibDelta -= u;
                      if (a.vibDelta < 0) {
                        a.vibrato |= 32;
                        a.vibDelta = 0;
                      }
                    }
                  }
                  n += u - a.vibDepth;
                } else {
                  if (a.vibrato >= 0 || !(a.vibrato & 1)) {
                    if (a.vibrato & 32) {
                      a.vibDelta += a.vibSpeed;
                      i = a.vibDepth << 1;
                      if (a.vibDelta >= i) {
                        a.vibrato &= ~32;
                        a.vibDelta = i;
                      }
                    } else {
                      a.vibDelta -= a.vibSpeed;
                      if (a.vibDelta < 0) {
                        a.vibrato |= 32;
                        a.vibDelta = 0;
                      }
                    }
                  }
                  i = a.vibDelta - a.vibDepth;
                  if (i) {
                    u += 160;
                    while (u < 256) {
                      i += i;
                      u += 24;
                    }
                    n += i;
                  }
                }
              }
              if (this.variant < 3) a.vibrato ^= 1;
              if (a.info & 32) {
                u = a.infoPrev;
                if (this.variant > 3) {
                  if (u < 0) {
                    a.portaDelta += -u;
                    u = a.portaDelta * n;
                    n += u >> 10;
                  } else {
                    a.portaDelta += u;
                    u = a.portaDelta * n;
                    n -= u >> 10;
                  }
                } else {
                  if (u < 0) {
                    a.portaDelta += -u << 11;
                    n += a.portaDelta >> 16;
                  } else {
                    a.portaDelta += u << 11;
                    n -= a.portaDelta >> 16;
                  }
                }
              }
              if (this.variant > 3) {
                u = (a.volFade * a.volume) / 100;
              } else {
                u = a.volume;
              }
              e.period = n;
              e.volume = u;
              if (a.enabled) {
                e.enabled = 1;
                e.pointer = a.loopPtr;
                e.length = a.repeat;
              }
              a = a.next;
            }
          },
        },
      });
      i.voices[0] = e(0);
      i.voices[0].next = i.voices[1] = e(1);
      i.voices[1].next = i.voices[2] = e(2);
      i.voices[2].next = i.voices[3] = e(3);
      return Object.seal(i);
    }
    var r = [
      1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 906, 856,
      808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360,
      339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151,
      143, 135, 127, 120, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
      113, 113, 3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032,
      1920, 1812, 6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064,
      3840, 3624,
    ];
    window.neoart.JHPlayer = n;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        period: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        portaDir: { value: 0, writable: true },
        portaPeriod: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.enabled = 0;
            this.period = 0;
            this.effect = 0;
            this.param = 0;
            this.volume = 0;
            this.portaDir = 0;
            this.portaPeriod = 0;
            this.portaSpeed = 0;
            this.vibratoPos = 0;
            this.vibratoSpeed = 0;
          },
        },
      });
    }
    function t(t) {
      var h = c(t);
      Object.defineProperties(h, {
        id: { value: "MKPlayer" },
        track: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        restart: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        restartSave: { value: 0, writable: true },
        force: {
          set: function (e) {
            if (e < n) e = n;
            else if (e > o) e = o;
            this.version = e;
            if (e == o) this.vibratoDepth = 6;
            else this.vibratoDepth = 7;
            if (e == i) {
              this.restartSave = this.restart;
              this.restart = 0;
            } else {
              this.restart = this.restartSave;
              this.restartSave = 0;
            }
          },
        },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.force = this.version;
            this.speed = 6;
            this.trackPos = 0;
            this.patternPos = 0;
            this.jumpFlag = 0;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[0];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var t = 0,
              f,
              l,
              c,
              h,
              p,
              d = 0,
              v;
            if (e.length < 2106) return;
            e.position = 1080;
            l = e.readString(4);
            if (l != "M.K." && l != "FLT4") return;
            e.position = 0;
            this.title = e.readString(20);
            this.version = n;
            e.position += 22;
            for (f = 1; f < 32; ++f) {
              v = e.readUshort();
              if (!v) {
                this.samples[f] = null;
                e.position += 28;
                continue;
              }
              p = a();
              e.position -= 24;
              p.name = e.readString(22);
              p.length = v << 1;
              e.position += 3;
              p.volume = e.readUbyte();
              p.loop = e.readUshort() << 1;
              p.repeat = e.readUshort() << 1;
              e.position += 22;
              p.pointer = d;
              d += p.length;
              this.samples[f] = p;
              if (p.length > 32768) this.version = r;
            }
            e.position = 950;
            this.length = e.readUbyte();
            v = e.readUbyte();
            this.restart = v < length ? v : 0;
            for (f = 0; f < 128; ++f) {
              v = e.readUbyte() << 8;
              this.track[f] = v;
              if (v > t) t = v;
            }
            e.position = 1084;
            t += 256;
            this.patterns.length = t;
            for (f = 0; f < t; ++f) {
              h = u();
              v = e.readUint();
              h.note = (v >> 16) & 4095;
              h.effect = (v >> 8) & 15;
              h.sample = ((v >> 24) & 240) | ((v >> 12) & 15);
              h.param = v & 255;
              this.patterns[f] = h;
              if (h.sample > 31 || !this.samples[h.sample]) h.sample = 0;
              if (h.effect == 3 || h.effect == 4) this.version = i;
              if (h.effect == 5 || h.effect == 6) this.version = o;
              if (h.effect > 6 && h.effect < 10) {
                this.version = 0;
                return;
              }
            }
            this.mixer.store(e, d);
            for (f = 1; f < 32; ++f) {
              p = this.samples[f];
              if (!p) continue;
              if (p.name.indexOf("2.0") > -1) this.version = o;
              if (p.loop) {
                p.loopPtr = p.pointer + p.loop;
                p.length = p.loop + p.repeat;
              } else {
                p.loopPtr = this.mixer.memory.length;
                p.repeat = 2;
              }
              d = p.pointer + 4;
              for (c = p.pointer; c < d; ++c) this.mixer.memory[c] = 0;
            }
            p = a();
            p.pointer = p.loopPtr = this.mixer.memory.length;
            p.length = p.repeat = 2;
            this.samples[0] = p;
            if (this.version < o && this.restart != 127) this.version = s;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s,
              u,
              a,
              c,
              h = this.voices[0];
            if (!this.tick) {
              r = this.track[this.trackPos] + this.patternPos;
              while (h) {
                e = h.channel;
                h.enabled = 0;
                s = this.patterns[r + h.index];
                h.effect = s.effect;
                h.param = s.param;
                if (s.sample) {
                  u = h.sample = this.samples[s.sample];
                  e.volume = h.volume = u.volume;
                } else {
                  u = h.sample;
                }
                if (s.note) {
                  if (h.effect == 3 || h.effect == 5) {
                    if (s.note < h.period) {
                      h.portaDir = 1;
                      h.portaPeriod = s.note;
                    } else if (s.note > h.period) {
                      h.portaDir = 0;
                      h.portaPeriod = s.note;
                    } else {
                      h.portaPeriod = 0;
                    }
                  } else {
                    h.enabled = 1;
                    h.vibratoPos = 0;
                    e.enabled = 0;
                    e.pointer = u.pointer;
                    e.length = u.length;
                    e.period = h.period = s.note;
                  }
                }
                switch (h.effect) {
                  case 11:
                    this.trackPos = h.param - 1;
                    this.jumpFlag ^= 1;
                    break;
                  case 12:
                    e.volume = h.param;
                    if (this.version == o) h.volume = h.param;
                    break;
                  case 13:
                    this.jumpFlag ^= 1;
                    break;
                  case 14:
                    this.mixer.filter.active = h.param ^ 1;
                    break;
                  case 15:
                    c = h.param;
                    if (c < 1) c = 1;
                    else if (c > 31) c = 31;
                    this.speed = c;
                    this.tick = 0;
                    break;
                }
                if (h.enabled) e.enabled = 1;
                e.pointer = u.loopPtr;
                e.length = u.repeat;
                h = h.next;
              }
            } else {
              while (h) {
                e = h.channel;
                if (!h.effect && !h.param) {
                  e.period = h.period;
                  h = h.next;
                  continue;
                }
                switch (h.effect) {
                  case 0:
                    c = this.tick % 3;
                    if (!c) {
                      e.period = h.period;
                      h = h.next;
                      continue;
                    }
                    if (c == 1) c = h.param >> 4;
                    else c = h.param & 15;
                    i = h.period & 4095;
                    n = 37 - c;
                    for (t = 0; t < n; ++t) {
                      if (i >= f[t]) {
                        e.period = f[t + c];
                        break;
                      }
                    }
                    break;
                  case 1:
                    h.period -= h.param;
                    if (h.period < 113) h.period = 113;
                    e.period = h.period;
                    break;
                  case 2:
                    h.period += h.param;
                    if (h.period > 856) h.period = 856;
                    e.period = h.period;
                    break;
                  case 3:
                  case 5:
                    if (h.effect == 5) {
                      a = 1;
                    } else if (h.param) {
                      h.portaSpeed = h.param;
                      h.param = 0;
                    }
                    if (h.portaPeriod) {
                      if (h.portaDir) {
                        h.period -= h.portaSpeed;
                        if (h.period <= h.portaPeriod) {
                          h.period = h.portaPeriod;
                          h.portaPeriod = 0;
                        }
                      } else {
                        h.period += h.portaSpeed;
                        if (h.period >= h.portaPeriod) {
                          h.period = h.portaPeriod;
                          h.portaPeriod = 0;
                        }
                      }
                    }
                    e.period = h.period;
                    break;
                  case 4:
                  case 6:
                    if (h.effect == 6) {
                      a = 1;
                    } else if (h.param) {
                      h.vibratoSpeed = h.param;
                    }
                    c = (h.vibratoPos >> 2) & 31;
                    c = ((h.vibratoSpeed & 15) * l[c]) >> this.vibratoDepth;
                    if (h.vibratoPos > 127) e.period = h.period - c;
                    else e.period = h.period + c;
                    c = (h.vibratoSpeed >> 2) & 60;
                    h.vibratoPos = (h.vibratoPos + c) & 255;
                    break;
                  case 10:
                    a = 1;
                    break;
                }
                if (a) {
                  c = h.param >> 4;
                  a = 0;
                  if (c) h.volume += c;
                  else h.volume -= h.param & 15;
                  if (h.volume < 0) h.volume = 0;
                  else if (h.volume > 64) h.volume = 64;
                  e.volume = h.volume;
                }
                h = h.next;
              }
            }
            if (++this.tick == this.speed) {
              this.tick = 0;
              this.patternPos += 4;
              if (this.patternPos == 256 || this.jumpFlag) {
                this.patternPos = this.jumpFlag = 0;
                this.trackPos = ++this.trackPos & 127;
                if (this.trackPos == this.length) {
                  this.trackPos = this.restart;
                  this.mixer.complete = 1;
                }
              }
            }
          },
        },
      });
      h.voices[0] = e(0);
      h.voices[0].next = h.voices[1] = e(1);
      h.voices[1].next = h.voices[2] = e(2);
      h.voices[2].next = h.voices[3] = e(3);
      h.track = new Uint16Array(128);
      return Object.seal(h);
    }
    var n = 1,
      r = 2,
      i = 3,
      s = 4,
      o = 5,
      f = [
        856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
        381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 0,
      ],
      l = [
        0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250,
        253, 255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74,
        49, 24,
      ];
    window.neoart.MKPlayer = t;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        loopCtr: { value: 0, writable: true },
        loopPos: { value: 0, writable: true },
        step: { value: 0, writable: true },
        period: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        pointer: { value: 0, writable: true },
        length: { value: 0, writable: true },
        loopPtr: { value: 0, writable: true },
        repeat: { value: 0, writable: true },
        finetune: { value: 0, writable: true },
        offset: { value: 0, writable: true },
        portaDir: { value: 0, writable: true },
        portaPeriod: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        glissando: { value: 0, writable: true },
        tremoloParam: { value: 0, writable: true },
        tremoloPos: { value: 0, writable: true },
        tremoloWave: { value: 0, writable: true },
        vibratoParam: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoWave: { value: 0, writable: true },
        funkPos: { value: 0, writable: true },
        funkSpeed: { value: 0, writable: true },
        funkWave: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.enabled = 0;
            this.loopCtr = 0;
            this.loopPos = 0;
            this.step = 0;
            this.period = 0;
            this.effect = 0;
            this.param = 0;
            this.volume = 0;
            this.pointer = 0;
            this.length = 0;
            this.loopPtr = 0;
            this.repeat = 0;
            this.finetune = 0;
            this.offset = 0;
            this.portaDir = 0;
            this.portaPeriod = 0;
            this.portaSpeed = 0;
            this.glissando = 0;
            this.tremoloParam = 0;
            this.tremoloPos = 0;
            this.tremoloWave = 0;
            this.vibratoParam = 0;
            this.vibratoPos = 0;
            this.vibratoWave = 0;
            this.funkPos = 0;
            this.funkSpeed = 0;
            this.funkWave = 0;
          },
        },
      });
    }
    function t() {
      var e = u();
      Object.defineProperties(e, { step: { value: 0, writable: true } });
      return Object.seal(e);
    }
    function n() {
      var e = a();
      Object.defineProperties(e, {
        finetune: { value: 0, writable: true },
        realLen: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function r(r) {
      var u = c(r);
      Object.defineProperties(u, {
        id: { value: "PTPlayer" },
        track: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        patternBreak: { value: 0, writable: true },
        patternDelay: { value: 0, writable: true },
        breakPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        force: {
          set: function (e) {
            if (e < i) e = i;
            else if (e > o) e = o;
            this.version = e;
            if (e < s) this.vibratoDepth = 6;
            else this.vibratoDepth = 7;
          },
        },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.tempo = 125;
            this.speed = 6;
            this.trackPos = 0;
            this.patternPos = 0;
            this.patternBreak = 0;
            this.patternDelay = 0;
            this.breakPos = 0;
            this.jumpFlag = 0;
            this.reset();
            this.force = this.version;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[0];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var r = 0,
              u,
              a,
              f,
              l,
              c,
              h = 0,
              p;
            if (e.length < 2106) return;
            e.position = 1080;
            a = e.readString(4);
            if (a != "M.K." && a != "M!K!") return;
            e.position = 0;
            this.title = e.readString(20);
            this.version = i;
            e.position += 22;
            for (u = 1; u < 32; ++u) {
              p = e.readUshort();
              if (!p) {
                this.samples[u] = null;
                e.position += 28;
                continue;
              }
              c = n();
              e.position -= 24;
              c.name = e.readString(22);
              c.length = c.realLen = p << 1;
              e.position += 2;
              c.finetune = e.readUbyte() * 37;
              c.volume = e.readUbyte();
              c.loop = e.readUshort() << 1;
              c.repeat = e.readUshort() << 1;
              e.position += 22;
              c.pointer = h;
              h += c.length;
              this.samples[u] = c;
            }
            e.position = 950;
            this.length = e.readUbyte();
            e.position++;
            for (u = 0; u < 128; ++u) {
              p = e.readUbyte() << 8;
              this.track[u] = p;
              if (p > r) r = p;
            }
            e.position = 1084;
            r += 256;
            this.patterns.length = r;
            for (u = 0; u < r; ++u) {
              l = t();
              l.step = p = e.readUint();
              l.note = (p >> 16) & 4095;
              l.effect = (p >> 8) & 15;
              l.sample = ((p >> 24) & 240) | ((p >> 12) & 15);
              l.param = p & 255;
              this.patterns[u] = l;
              if (l.sample > 31 || !this.samples[l.sample]) l.sample = 0;
              if (l.effect == 15 && l.param > 31) this.version = s;
              if (l.effect == 8) this.version = o;
            }
            this.mixer.store(e, h);
            for (u = 1; u < 32; ++u) {
              c = this.samples[u];
              if (!c) continue;
              if (c.loop || c.repeat > 4) {
                c.loopPtr = c.pointer + c.loop;
                c.length = c.loop + c.repeat;
              } else {
                c.loopPtr = this.mixer.memory.length;
                c.repeat = 2;
              }
              h = c.pointer + 2;
              for (f = c.pointer; f < h; ++f) this.mixer.memory[f] = 0;
            }
            c = n();
            c.pointer = c.loopPtr = this.mixer.memory.length;
            c.length = c.repeat = 2;
            this.samples[0] = c;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s,
              o = this.voices[0];
            if (!this.tick) {
              if (this.patternDelay) {
                this.effects();
              } else {
                n = this.track[this.trackPos] + this.patternPos;
                while (o) {
                  e = o.channel;
                  o.enabled = 0;
                  if (!o.step) e.period = o.period;
                  r = this.patterns[n + o.index];
                  o.step = r.step;
                  o.effect = r.effect;
                  o.param = r.param;
                  if (r.sample) {
                    i = o.sample = this.samples[r.sample];
                    o.pointer = i.pointer;
                    o.length = i.length;
                    o.loopPtr = o.funkWave = i.loopPtr;
                    o.repeat = i.repeat;
                    o.finetune = i.finetune;
                    e.volume = o.volume = i.volume;
                  } else {
                    i = o.sample;
                  }
                  if (!r.note) {
                    this.moreEffects(o);
                    o = o.next;
                    continue;
                  } else {
                    if ((o.step & 4080) == 3664) {
                      o.finetune = (o.param & 15) * 37;
                    } else if (o.effect == 3 || o.effect == 5) {
                      if (r.note == o.period) {
                        o.portaPeriod = 0;
                      } else {
                        t = o.finetune;
                        s = t + 37;
                        for (; t < s; ++t) if (r.note >= f[t]) break;
                        if (t == s) s--;
                        if (t > 0) {
                          s = ((o.finetune / 37) >> 0) & 8;
                          if (s) t--;
                        }
                        o.portaPeriod = f[t];
                        o.portaDir = r.note > o.portaPeriod ? 0 : 1;
                      }
                    } else if (o.effect == 9) {
                      this.moreEffects(o);
                    }
                  }
                  for (t = 0; t < 37; ++t) if (r.note >= f[t]) break;
                  o.period = f[o.finetune + t];
                  if ((o.step & 4080) == 3792) {
                    if (o.funkSpeed) this.updateFunk(o);
                    this.extended(o);
                    o = o.next;
                    continue;
                  }
                  if (o.vibratoWave < 4) o.vibratoPos = 0;
                  if (o.tremoloWave < 4) o.tremoloPos = 0;
                  e.enabled = 0;
                  e.pointer = o.pointer;
                  e.length = o.length;
                  e.period = o.period;
                  o.enabled = 1;
                  this.moreEffects(o);
                  o = o.next;
                }
                o = this.voices[0];
                while (o) {
                  e = o.channel;
                  if (o.enabled) e.enabled = 1;
                  e.pointer = o.loopPtr;
                  e.length = o.repeat;
                  o = o.next;
                }
              }
            } else {
              this.effects();
            }
            if (++this.tick == this.speed) {
              this.tick = 0;
              this.patternPos += 4;
              if (this.patternDelay)
                if (--this.patternDelay) this.patternPos -= 4;
              if (this.patternBreak) {
                this.patternBreak = 0;
                this.patternPos = this.breakPos;
                this.breakPos = 0;
              }
              if (this.patternPos == 256 || this.jumpFlag) {
                this.patternPos = this.breakPos;
                this.breakPos = 0;
                this.jumpFlag = 0;
                if (++this.trackPos == this.length) {
                  this.trackPos = 0;
                  this.mixer.complete = 1;
                }
              }
            }
          },
        },
        effects: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.voices[0],
              o;
            while (s) {
              e = s.channel;
              if (s.funkSpeed) this.updateFunk(s);
              if ((s.step & 4095) == 0) {
                e.period = s.period;
                s = s.next;
                continue;
              }
              switch (s.effect) {
                case 0:
                  i = this.tick % 3;
                  if (!i) {
                    e.period = s.period;
                    s = s.next;
                    continue;
                  }
                  if (i == 1) i = s.param >> 4;
                  else i = s.param & 15;
                  t = s.finetune;
                  n = t + 37;
                  for (; t < n; ++t)
                    if (s.period >= f[t]) {
                      e.period = f[t + i];
                      break;
                    }
                  break;
                case 1:
                  s.period -= s.param;
                  if (s.period < 113) s.period = 113;
                  e.period = s.period;
                  break;
                case 2:
                  s.period += s.param;
                  if (s.period > 856) s.period = 856;
                  e.period = s.period;
                  break;
                case 3:
                case 5:
                  if (s.effect == 5) {
                    r = 1;
                  } else {
                    s.portaSpeed = s.param;
                    s.param = 0;
                  }
                  if (s.portaPeriod) {
                    if (s.portaDir) {
                      s.period -= s.portaSpeed;
                      if (s.period <= s.portaPeriod) {
                        s.period = s.portaPeriod;
                        s.portaPeriod = 0;
                      }
                    } else {
                      s.period += s.portaSpeed;
                      if (s.period >= s.portaPeriod) {
                        s.period = s.portaPeriod;
                        s.portaPeriod = 0;
                      }
                    }
                    if (s.glissando) {
                      t = s.finetune;
                      i = t + 37;
                      for (; t < i; ++t) if (s.period >= f[t]) break;
                      if (t == i) t--;
                      e.period = f[t];
                    } else {
                      e.period = s.period;
                    }
                  }
                  break;
                case 4:
                case 6:
                  if (s.effect == 6) {
                    r = 1;
                  } else if (s.param) {
                    i = s.param & 15;
                    if (i) s.vibratoParam = (s.vibratoParam & 240) | i;
                    i = s.param & 240;
                    if (i) s.vibratoParam = (s.vibratoParam & 15) | i;
                  }
                  n = (s.vibratoPos >> 2) & 31;
                  o = s.vibratoWave & 3;
                  if (o) {
                    i = 255;
                    n <<= 3;
                    if (o == 1) {
                      if (s.vibratoPos > 127) i -= n;
                      else i = n;
                    }
                  } else {
                    i = l[n];
                  }
                  i = ((s.vibratoParam & 15) * i) >> this.vibratoDepth;
                  if (s.vibratoPos > 127) e.period = s.period - i;
                  else e.period = s.period + i;
                  i = (s.vibratoParam >> 2) & 60;
                  s.vibratoPos = (s.vibratoPos + i) & 255;
                  break;
                case 7:
                  e.period = s.period;
                  if (s.param) {
                    i = s.param & 15;
                    if (i) s.tremoloParam = (s.tremoloParam & 240) | i;
                    i = s.param & 240;
                    if (i) s.tremoloParam = (s.tremoloParam & 15) | i;
                  }
                  n = (s.tremoloPos >> 2) & 31;
                  o = s.tremoloWave & 3;
                  if (o) {
                    i = 255;
                    n <<= 3;
                    if (o == 1) {
                      if (s.tremoloPos > 127) i -= n;
                      else i = n;
                    }
                  } else {
                    i = l[n];
                  }
                  i = ((s.tremoloParam & 15) * i) >> 6;
                  if (s.tremoloPos > 127) e.volume = s.volume - i;
                  else e.volume = s.volume + i;
                  i = (s.tremoloParam >> 2) & 60;
                  s.tremoloPos = (s.tremoloPos + i) & 255;
                  break;
                case 10:
                  r = 1;
                  break;
                case 14:
                  this.extended(s);
                  break;
              }
              if (r) {
                r = 0;
                i = s.param >> 4;
                if (i) s.volume += i;
                else s.volume -= s.param & 15;
                if (s.volume < 0) s.volume = 0;
                else if (s.volume > 64) s.volume = 64;
                e.volume = s.volume;
              }
              s = s.next;
            }
          },
        },
        moreEffects: {
          value: function (e) {
            var t = e.channel,
              n;
            if (e.funkSpeed) this.updateFunk(e);
            switch (e.effect) {
              case 9:
                if (e.param) e.offset = e.param;
                n = e.offset << 8;
                if (n >= e.length) {
                  e.length = 2;
                } else {
                  e.pointer += n;
                  e.length -= n;
                }
                break;
              case 11:
                this.trackPos = e.param - 1;
                this.breakPos = 0;
                this.jumpFlag = 1;
                break;
              case 12:
                e.volume = e.param;
                if (e.volume > 64) e.volume = 64;
                t.volume = e.volume;
                break;
              case 13:
                this.breakPos = (e.param >> 4) * 10 + (e.param & 15);
                if (this.breakPos > 63) this.breakPos = 0;
                else this.breakPos <<= 2;
                this.jumpFlag = 1;
                break;
              case 14:
                this.extended(e);
                break;
              case 15:
                if (!e.param) return;
                if (e.param < 32) this.speed = e.param;
                else
                  this.mixer.samplesTick =
                    ((this.sampleRate * 2.5) / e.param) >> 0;
                this.tick = 0;
                break;
            }
          },
        },
        extended: {
          value: function (e) {
            var t = e.channel,
              n = e.param >> 4,
              r,
              i,
              s,
              o = e.param & 15;
            switch (n) {
              case 0:
                this.mixer.filter.active = o;
                break;
              case 1:
                if (this.tick) return;
                e.period -= o;
                if (e.period < 113) e.period = 113;
                t.period = e.period;
                break;
              case 2:
                if (this.tick) return;
                e.period += o;
                if (e.period > 856) e.period = 856;
                t.period = e.period;
                break;
              case 3:
                e.glissando = o;
                break;
              case 4:
                e.vibratoWave = o;
                break;
              case 5:
                e.finetune = o * 37;
                break;
              case 6:
                if (this.tick) return;
                if (o) {
                  if (e.loopCtr) e.loopCtr--;
                  else e.loopCtr = o;
                  if (e.loopCtr) {
                    this.breakPos = e.loopPos << 2;
                    this.patternBreak = 1;
                  }
                } else {
                  e.loopPos = this.patternPos >> 2;
                }
                break;
              case 7:
                e.tremoloWave = o;
                break;
              case 8:
                i = e.length - 2;
                s = this.mixer.memory;
                for (r = e.loopPtr; r < i; ) s[r] = (s[r] + s[++r]) * 0.5;
                s[++r] = (s[r] + s[0]) * 0.5;
                break;
              case 9:
                if (this.tick || !o || !e.period) return;
                if (this.tick % o) return;
                t.enabled = 0;
                t.pointer = e.pointer;
                t.length = e.length;
                t.delay = 30;
                t.enabled = 1;
                t.pointer = e.loopPtr;
                t.length = e.repeat;
                t.period = e.period;
                break;
              case 10:
                if (this.tick) return;
                e.volume += o;
                if (e.volume > 64) e.volume = 64;
                t.volume = e.volume;
                break;
              case 11:
                if (this.tick) return;
                e.volume -= o;
                if (e.volume < 0) e.volume = 0;
                t.volume = e.volume;
                break;
              case 12:
                if (this.tick == o) t.volume = e.volume = 0;
                break;
              case 13:
                if (this.tick != o || !e.period) return;
                t.enabled = 0;
                t.pointer = e.pointer;
                t.length = e.length;
                t.delay = 30;
                t.enabled = 1;
                t.pointer = e.loopPtr;
                t.length = e.repeat;
                t.period = e.period;
                break;
              case 14:
                if (this.tick || this.patternDelay) return;
                this.patternDelay = ++o;
                break;
              case 15:
                if (this.tick) return;
                e.funkSpeed = o;
                if (o) this.updateFunk(e);
                break;
            }
          },
        },
        updateFunk: {
          value: function (e) {
            var t = e.channel,
              n,
              r,
              s = h[e.funkSpeed];
            e.funkPos += s;
            if (e.funkPos < 128) return;
            e.funkPos = 0;
            if (this.version == i) {
              n = e.pointer + e.sample.realLen - e.repeat;
              r = e.funkWave + e.repeat;
              if (r > n) {
                r = e.loopPtr;
                t.length = e.repeat;
              }
              t.pointer = e.funkWave = r;
            } else {
              n = e.loopPtr + e.repeat;
              r = e.funkWave + 1;
              if (r >= n) r = e.loopPtr;
              this.mixer.memory[r] = -this.mixer.memory[r];
            }
          },
        },
      });
      u.voices[0] = e(0);
      u.voices[0].next = u.voices[1] = e(1);
      u.voices[1].next = u.voices[2] = e(2);
      u.voices[2].next = u.voices[3] = e(3);
      u.track = new Uint16Array(128);
      return Object.seal(u);
    }
    var i = 1,
      s = 2,
      o = 3,
      f = [
        856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
        381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 0, 850, 802, 757, 715, 674, 637,
        601, 567, 535, 505, 477, 450, 425, 401, 379, 357, 337, 318, 300, 284,
        268, 253, 239, 225, 213, 201, 189, 179, 169, 159, 150, 142, 134, 126,
        119, 113, 0, 844, 796, 752, 709, 670, 632, 597, 563, 532, 502, 474, 447,
        422, 398, 376, 355, 335, 316, 298, 282, 266, 251, 237, 224, 211, 199,
        188, 177, 167, 158, 149, 141, 133, 125, 118, 112, 0, 838, 791, 746, 704,
        665, 628, 592, 559, 528, 498, 470, 444, 419, 395, 373, 352, 332, 314,
        296, 280, 264, 249, 235, 222, 209, 198, 187, 176, 166, 157, 148, 140,
        132, 125, 118, 111, 0, 832, 785, 741, 699, 660, 623, 588, 555, 524, 495,
        467, 441, 416, 392, 370, 350, 330, 312, 294, 278, 262, 247, 233, 220,
        208, 196, 185, 175, 165, 156, 147, 139, 131, 124, 117, 110, 0, 826, 779,
        736, 694, 655, 619, 584, 551, 520, 491, 463, 437, 413, 390, 368, 347,
        328, 309, 292, 276, 260, 245, 232, 219, 206, 195, 184, 174, 164, 155,
        146, 138, 130, 123, 116, 109, 0, 820, 774, 730, 689, 651, 614, 580, 547,
        516, 487, 460, 434, 410, 387, 365, 345, 325, 307, 290, 274, 258, 244,
        230, 217, 205, 193, 183, 172, 163, 154, 145, 137, 129, 122, 115, 109, 0,
        814, 768, 725, 684, 646, 610, 575, 543, 513, 484, 457, 431, 407, 384,
        363, 342, 323, 305, 288, 272, 256, 242, 228, 216, 204, 192, 181, 171,
        161, 152, 144, 136, 128, 121, 114, 108, 0, 907, 856, 808, 762, 720, 678,
        640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302,
        285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143, 135,
        127, 120, 0, 900, 850, 802, 757, 715, 675, 636, 601, 567, 535, 505, 477,
        450, 425, 401, 379, 357, 337, 318, 300, 284, 268, 253, 238, 225, 212,
        200, 189, 179, 169, 159, 150, 142, 134, 126, 119, 0, 894, 844, 796, 752,
        709, 670, 632, 597, 563, 532, 502, 474, 447, 422, 398, 376, 355, 335,
        316, 298, 282, 266, 251, 237, 223, 211, 199, 188, 177, 167, 158, 149,
        141, 133, 125, 118, 0, 887, 838, 791, 746, 704, 665, 628, 592, 559, 528,
        498, 470, 444, 419, 395, 373, 352, 332, 314, 296, 280, 264, 249, 235,
        222, 209, 198, 187, 176, 166, 157, 148, 140, 132, 125, 118, 0, 881, 832,
        785, 741, 699, 660, 623, 588, 555, 524, 494, 467, 441, 416, 392, 370,
        350, 330, 312, 294, 278, 262, 247, 233, 220, 208, 196, 185, 175, 165,
        156, 147, 139, 131, 123, 117, 0, 875, 826, 779, 736, 694, 655, 619, 584,
        551, 520, 491, 463, 437, 413, 390, 368, 347, 328, 309, 292, 276, 260,
        245, 232, 219, 206, 195, 184, 174, 164, 155, 146, 138, 130, 123, 116, 0,
        868, 820, 774, 730, 689, 651, 614, 580, 547, 516, 487, 460, 434, 410,
        387, 365, 345, 325, 307, 290, 274, 258, 244, 230, 217, 205, 193, 183,
        172, 163, 154, 145, 137, 129, 122, 115, 0, 862, 814, 768, 725, 684, 646,
        610, 575, 543, 513, 484, 457, 431, 407, 384, 363, 342, 323, 305, 288,
        272, 256, 242, 228, 216, 203, 192, 181, 171, 161, 152, 144, 136, 128,
        121, 114, 0,
      ],
      l = [
        0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250,
        253, 255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74,
        49, 24,
      ],
      h = [0, 5, 6, 7, 8, 10, 11, 13, 16, 19, 22, 26, 32, 43, 64, 128];
    window.neoart.PTPlayer = r;
  })();
  (function () {
    function e(e, t) {
      return Object.create(null, {
        index: { value: e, writable: true },
        bitFlag: { value: t, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        trackPtr: { value: 0, writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        tick: { value: 0, writable: true },
        busy: { value: 0, writable: true },
        flags: { value: 0, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        vibratoPtr: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        synthPos: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.trackPtr = 0;
            this.trackPos = 0;
            this.patternPos = 0;
            this.tick = 1;
            this.busy = 1;
            this.flags = 0;
            this.note = 0;
            this.period = 0;
            this.volume = 0;
            this.portaSpeed = 0;
            this.vibratoPtr = 0;
            this.vibratoPos = 0;
            this.synthPos = 0;
          },
        },
      });
    }
    function t() {
      var e = a();
      Object.defineProperties(e, {
        relative: { value: 0, writable: true },
        divider: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        hiPos: { value: 0, writable: true },
        loPos: { value: 0, writable: true },
        wave: { value: [], writable: true },
      });
      return Object.seal(e);
    }
    function n() {
      return Object.create(null, {
        speed: { value: 0, writable: true },
        tracks: { value: null, writable: true },
      });
    }
    function r(r) {
      var i = c(r);
      Object.defineProperties(i, {
        id: { value: "RHPlayer" },
        songs: { value: [], writable: true },
        samples: { value: [], writable: true },
        song: { value: null, writable: true },
        periods: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        voices: { value: [], writable: true },
        stream: { value: null, writable: true },
        complete: { value: 0, writable: true },
        variant: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t,
              n,
              r = this.voices[3];
            this.reset();
            this.song = this.songs[this.playSong];
            this.complete = 15;
            for (e = 0; e < this.samples.length; ++e) {
              n = this.samples[e];
              if (n.wave.length) {
                for (t = 0; t < n.length; ++t)
                  this.mixer.memory[n.pointer + t] = n.wave[t];
              }
            }
            while (r) {
              r.initialize();
              r.channel = this.mixer.channels[r.index];
              r.trackPtr = this.song.tracks[r.index];
              r.trackPos = 4;
              this.stream.position = r.trackPtr;
              r.patternPos = this.stream.readUint();
              r = r.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var r, i, s, o, u, a, f, l, c, h, p, d, v;
            e.position = 44;
            while (e.position < 1024) {
              v = e.readUshort();
              if (v == 32272 || v == 32288) {
                v = e.readUshort();
                if (v == 16890) {
                  r = e.position + e.readUshort();
                  v = e.readUshort();
                  if (v == 53756) {
                    a = r + e.readUint();
                    this.mixer.loopLen = 64;
                    e.position += 2;
                  } else {
                    a = r;
                    this.mixer.loopLen = 512;
                  }
                  f = e.position + e.readUshort();
                  v = e.readUbyte();
                  if (v == 114) l = e.readUbyte();
                }
              } else if (v == 20937) {
                e.position += 2;
                v = e.readUshort();
                if (v == 17914) {
                  d = e.position + e.readUshort();
                  e.position += 2;
                  while (1) {
                    v = e.readUshort();
                    if (v == 19450) {
                      p = e.position + e.readUshort();
                      break;
                    }
                  }
                }
              } else if (v == 49404) {
                e.position += 2;
                v = e.readUshort();
                if (v == 16875) h = e.readUshort();
              } else if (v == 13421) {
                e.position += 2;
                v = e.readUshort();
                if (v == 18938) this.vibrato = e.position + e.readUshort();
              } else if (v == 16960) {
                v = e.readUshort();
                if (v == 17914) {
                  this.periods = e.position + e.readUshort();
                  break;
                }
              }
            }
            if (!f || !a || !l || !h) return;
            e.position = a;
            this.samples = [];
            l++;
            for (r = 0; r < l; ++r) {
              u = t();
              u.length = e.readUint();
              u.relative = parseInt(3579545 / e.readUshort());
              u.pointer = this.mixer.store(e, u.length);
              this.samples[r] = u;
            }
            e.position = f;
            for (r = 0; r < l; ++r) {
              u = this.samples[r];
              e.position += 4;
              u.loopPtr = e.readInt();
              e.position += 6;
              u.volume = e.readUshort();
              if (p) {
                u.divider = e.readUshort();
                u.vibrato = e.readUshort();
                u.hiPos = e.readUshort();
                u.loPos = e.readUshort();
                e.position += 8;
              }
            }
            if (p) {
              e.position = p;
              r = (p - f) >> 5;
              s = r + 3;
              this.variant = 1;
              if (r >= l) {
                for (i = l; i < r; ++i) this.samples[i] = t();
              }
              for (; r < s; ++r) {
                u = t();
                e.position += 4;
                u.loopPtr = e.readInt();
                u.length = e.readUshort();
                u.relative = e.readUshort();
                e.position += 2;
                u.volume = e.readUshort();
                u.divider = e.readUshort();
                u.vibrato = e.readUshort();
                u.hiPos = e.readUshort();
                u.loPos = e.readUshort();
                o = e.position;
                e.position = d;
                e.position = e.readInt();
                u.pointer = this.mixer.memory.length;
                this.mixer.memory.length += u.length;
                for (i = 0; i < u.length; ++i) u.wave[i] = e.readByte();
                this.samples[r] = u;
                d += 4;
                e.position = o;
              }
            }
            e.position = h;
            this.songs = [];
            v = 65536;
            while (1) {
              c = n();
              e.position++;
              c.tracks = new Uint32Array(4);
              c.speed = e.readUbyte();
              for (r = 0; r < 4; ++r) {
                i = e.readUint();
                if (i < v) v = i;
                c.tracks[r] = i;
              }
              this.songs.push(c);
              if (v - e.position < 18) break;
            }
            this.lastSong = this.songs.length - 1;
            e.length = a;
            e.position = 352;
            while (e.position < 512) {
              v = e.readUshort();
              if (v == 45116) {
                v = e.readUshort();
                if (v == 133) {
                  this.variant = 2;
                } else if (v == 134) {
                  this.variant = 4;
                } else if (v == 135) {
                  this.variant = 3;
                }
              }
            }
            this.stream = e;
            this.version = 1;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i = this.voices[3];
            while (i) {
              e = i.channel;
              this.stream.position = i.patternPos;
              n = i.sample;
              if (!i.busy) {
                i.busy = 1;
                if (n.loopPtr == 0) {
                  e.pointer = this.mixer.loopPtr;
                  e.length = this.mixer.loopLen;
                } else if (n.loopPtr > 0) {
                  e.pointer = n.pointer + n.loopPtr;
                  e.length = n.length - n.loopPtr;
                }
              }
              if (--i.tick == 0) {
                i.flags = 0;
                t = 1;
                while (t) {
                  r = this.stream.readByte();
                  if (r < 0) {
                    switch (r) {
                      case -121:
                        if (this.variant == 3)
                          i.volume = this.stream.readUbyte();
                        break;
                      case -122:
                        if (this.variant == 4)
                          i.volume = this.stream.readUbyte();
                        break;
                      case -123:
                        if (this.variant > 1) this.mixer.complete = 1;
                        break;
                      case -124:
                        this.stream.position = i.trackPtr + i.trackPos;
                        r = this.stream.readUint();
                        i.trackPos += 4;
                        if (!r) {
                          this.stream.position = i.trackPtr;
                          r = this.stream.readUint();
                          i.trackPos = 4;
                          if (!this.loopSong) {
                            this.complete &= ~i.bitFlag;
                            if (!this.complete) this.mixer.complete = 1;
                          }
                        }
                        this.stream.position = r;
                        break;
                      case -125:
                        if (this.variant == 4) i.flags |= 4;
                        break;
                      case -126:
                        i.tick = this.song.speed * this.stream.readByte();
                        i.patternPos = this.stream.position;
                        e.pointer = this.mixer.loopPtr;
                        e.length = this.mixer.loopLen;
                        t = 0;
                        break;
                      case -127:
                        i.portaSpeed = this.stream.readByte();
                        i.flags |= 1;
                        break;
                      case -128:
                        r = this.stream.readByte();
                        if (r < 0) r = 0;
                        i.sample = n = this.samples[r];
                        i.vibratoPtr = this.vibrato + n.vibrato;
                        i.vibratoPos = i.vibratoPtr;
                        break;
                    }
                  } else {
                    i.tick = this.song.speed * r;
                    i.note = this.stream.readByte();
                    i.patternPos = this.stream.position;
                    i.synthPos = n.loPos;
                    i.vibratoPos = i.vibratoPtr;
                    e.pointer = n.pointer;
                    e.length = n.length;
                    e.volume = i.volume ? i.volume : n.volume;
                    this.stream.position = this.periods + (i.note << 1);
                    r = this.stream.readUshort() * n.relative;
                    e.period = i.period = r >> 10;
                    e.enabled = 1;
                    i.busy = t = 0;
                  }
                }
              } else {
                if (i.tick == 1) {
                  if (this.variant != 4 || !(i.flags & 4)) e.enabled = 0;
                }
                if (i.flags & 1) e.period = i.period += i.portaSpeed;
                if (n.divider) {
                  this.stream.position = i.vibratoPos;
                  r = this.stream.readByte();
                  if (r == -124) {
                    this.stream.position = i.vibratoPtr;
                    r = this.stream.readByte();
                  }
                  i.vibratoPos = this.stream.position;
                  r = parseInt(i.period / n.divider) * r;
                  e.period = i.period + r;
                }
              }
              if (n.hiPos) {
                r = 0;
                if (i.flags & 2) {
                  i.synthPos--;
                  if (i.synthPos <= n.loPos) {
                    i.flags &= -3;
                    r = 60;
                  }
                } else {
                  i.synthPos++;
                  if (i.synthPos > n.hiPos) {
                    i.flags |= 2;
                    r = 60;
                  }
                }
                this.mixer.memory[n.pointer + i.synthPos] = r;
              }
              i = i.next;
            }
          },
        },
      });
      i.voices[3] = e(3, 8);
      i.voices[3].next = i.voices[2] = e(2, 4);
      i.voices[2].next = i.voices[1] = e(1, 2);
      i.voices[1].next = i.voices[0] = e(0, 1);
      return Object.seal(i);
    }
    window.neoart.RHPlayer = r;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        step: { value: 0, writable: true },
        row: { value: 0, writable: true },
        sample: { value: 0, writable: true },
        samplePtr: { value: 0, writable: true },
        sampleLen: { value: 0, writable: true },
        note: { value: 0, writable: true },
        noteTimer: { value: 0, writable: true },
        period: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        bendTo: { value: 0, writable: true },
        bendSpeed: { value: 0, writable: true },
        arpeggioCtr: { value: 0, writable: true },
        envelopeCtr: { value: 0, writable: true },
        pitchCtr: { value: 0, writable: true },
        pitchFallCtr: { value: 0, writable: true },
        sustainCtr: { value: 0, writable: true },
        phaseTimer: { value: 0, writable: true },
        phaseSpeed: { value: 0, writable: true },
        wavePos: { value: 0, writable: true },
        waveList: { value: 0, writable: true },
        waveTimer: { value: 0, writable: true },
        waitCtr: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.step = 0;
            this.row = 0;
            this.sample = 0;
            this.samplePtr = -1;
            this.sampleLen = 0;
            this.note = 0;
            this.noteTimer = 0;
            this.period = 39321;
            this.volume = 0;
            this.bendTo = 0;
            this.bendSpeed = 0;
            this.arpeggioCtr = 0;
            this.envelopeCtr = 0;
            this.pitchCtr = 0;
            this.pitchFallCtr = 0;
            this.sustainCtr = 0;
            this.phaseTimer = 0;
            this.phaseSpeed = 0;
            this.wavePos = 0;
            this.waveList = 0;
            this.waveTimer = 0;
            this.waitCtr = 0;
          },
        },
      });
    }
    function t() {
      var e = u();
      Object.defineProperties(e, { speed: { value: 0, writable: true } });
      return Object.seal(e);
    }
    function n() {
      var e = a();
      Object.defineProperties(e, {
        waveform: { value: 0, writable: true },
        arpeggio: { value: null, writable: true },
        attackSpeed: { value: 0, writable: true },
        attackMax: { value: 0, writable: true },
        decaySpeed: { value: 0, writable: true },
        decayMin: { value: 0, writable: true },
        sustain: { value: 0, writable: true },
        releaseSpeed: { value: 0, writable: true },
        releaseMin: { value: 0, writable: true },
        phaseShift: { value: 0, writable: true },
        phaseSpeed: { value: 0, writable: true },
        finetune: { value: 0, writable: true },
        pitchFall: { value: 0, writable: true },
      });
      e.arpeggio = new Uint8Array(16);
      return Object.seal(e);
    }
    function r(r) {
      var u = c(r);
      Object.defineProperties(u, {
        id: { value: "S1Player" },
        tracksPtr: { value: null, writable: true },
        tracks: { value: [], writable: true },
        patternsPtr: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        waveLists: { value: null, writable: true },
        speedDef: { value: 0, writable: true },
        patternDef: { value: 0, writable: true },
        mix1Speed: { value: 0, writable: true },
        mix2Speed: { value: 0, writable: true },
        mix1Dest: { value: 0, writable: true },
        mix2Dest: { value: 0, writable: true },
        mix1Source1: { value: 0, writable: true },
        mix1Source2: { value: 0, writable: true },
        mix2Source1: { value: 0, writable: true },
        mix2Source2: { value: 0, writable: true },
        doFilter: { value: 0, writable: true },
        doReset: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        trackEnd: { value: 0, writable: true },
        trackLen: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        patternEnd: { value: 0, writable: true },
        patternLen: { value: 0, writable: true },
        mix1Ctr: { value: 0, writable: true },
        mix2Ctr: { value: 0, writable: true },
        mix1Pos: { value: 0, writable: true },
        mix2Pos: { value: 0, writable: true },
        audPtr: { value: 0, writable: true },
        audLen: { value: 0, writable: true },
        audPer: { value: 0, writable: true },
        audVol: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e,
              t,
              n = this.voices[0];
            this.reset();
            this.speed = this.speedDef;
            this.tick = this.speedDef;
            this.trackPos = 1;
            this.trackEnd = 0;
            this.patternPos = -1;
            this.patternEnd = 0;
            this.patternLen = this.patternDef;
            this.mix1Ctr = this.mix1Pos = 0;
            this.mix2Ctr = this.mix2Pos = 0;
            while (n) {
              n.initialize();
              e = this.mixer.channels[n.index];
              n.channel = e;
              n.step = this.tracksPtr[n.index];
              t = this.tracks[n.step];
              n.row = this.patternsPtr[t.pattern];
              n.sample = this.patterns[n.row].sample;
              e.length = 32;
              e.period = n.period;
              e.enabled = 1;
              n = n.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var r, u, a, l, c, h, p, m, g, y, b, w, E, S, x, T;
            while (e.bytesAvailable > 8) {
              y = e.readUshort();
              if (y != 16890) continue;
              l = e.readUshort();
              y = e.readUshort();
              if (y != 53736) continue;
              y = e.readUshort();
              if (y == 65492) {
                if (l == 4076) T = i;
                else if (l == 5222) T = d;
                else T = l;
                p = l + e.position - 6;
                break;
              }
            }
            if (!p) return;
            e.position = p;
            a = e.readString(32);
            if (a != " SID-MON BY R.v.VLIET  (c) 1988 ") return;
            e.position = p - 44;
            y = e.readUint();
            for (u = 1; u < 4; ++u)
              this.tracksPtr[u] = ((e.readUint() - y) / 6) >> 0;
            e.position = p - 8;
            y = e.readUint();
            h = e.readUint();
            if (h < y) h = e.length - p;
            E = (h - y) >> 2;
            this.patternsPtr = new Uint32Array(E);
            e.position = p + y + 4;
            for (u = 1; u < E; ++u) {
              y = (e.readUint() / 5) >> 0;
              if (y == 0) {
                E = u;
                break;
              }
              this.patternsPtr[u] = y;
            }
            e.position = p - 44;
            y = e.readUint();
            e.position = p - 28;
            h = ((e.readUint() - y) / 6) >> 0;
            this.tracks.length = h;
            e.position = p + y;
            for (u = 0; u < h; ++u) {
              b = f();
              b.pattern = e.readUint();
              if (b.pattern >= E) b.pattern = 0;
              e.readByte();
              b.transpose = e.readByte();
              if (b.transpose < -99 || b.transpose > 99) b.transpose = 0;
              this.tracks[u] = b;
            }
            e.position = p - 24;
            y = e.readUint();
            x = e.readUint() - y;
            for (u = 0; u < 32; ++u) this.mixer.memory[u] = 0;
            this.mixer.store(e, x, p + y);
            x >>= 5;
            e.position = p - 16;
            y = e.readUint();
            h = e.readUint() - y + 16;
            l = (x + 2) << 4;
            this.waveLists = new Uint8Array(h < l ? l : h);
            e.position = p + y;
            u = 0;
            while (u < l) {
              this.waveLists[u++] = u >> 4;
              this.waveLists[u++] = 255;
              this.waveLists[u++] = 255;
              this.waveLists[u++] = 16;
              u += 12;
            }
            for (u = 16; u < h; ++u) this.waveLists[u] = e.readUbyte();
            e.position = p - 20;
            e.position = p + e.readUint();
            this.mix1Source1 = e.readUint();
            this.mix2Source1 = e.readUint();
            this.mix1Source2 = e.readUint();
            this.mix2Source2 = e.readUint();
            this.mix1Dest = e.readUint();
            this.mix2Dest = e.readUint();
            this.patternDef = e.readUint();
            this.trackLen = e.readUint();
            this.speedDef = e.readUint();
            this.mix1Speed = e.readUint();
            this.mix2Speed = e.readUint();
            if (this.mix1Source1 > x) this.mix1Source1 = 0;
            if (this.mix2Source1 > x) this.mix2Source1 = 0;
            if (this.mix1Source2 > x) this.mix1Source2 = 0;
            if (this.mix2Source2 > x) this.mix2Source2 = 0;
            if (this.mix1Dest > x) this.mix1Speed = 0;
            if (this.mix2Dest > x) this.mix2Speed = 0;
            if (this.speedDef == 0) this.speedDef = 4;
            e.position = p - 28;
            l = e.readUint();
            w = (e.readUint() - l) >> 5;
            if (w > 63) w = 63;
            h = w + 1;
            e.position = p - 4;
            y = e.readUint();
            if (y == 1) {
              e.position = 1820;
              y = e.readUshort();
              if (y != 19962) {
                e.position = 1788;
                y = e.readUshort();
                if (y != 19962) {
                  this.version = 0;
                  return;
                }
              }
              e.position += e.readUshort();
              this.samples.length = h + 3;
              for (u = 0; u < 3; ++u) {
                g = n();
                g.waveform = 16 + u;
                g.length = v[u];
                g.pointer = this.mixer.store(e, g.length);
                g.loop = g.loopPtr = 0;
                g.repeat = 4;
                g.volume = 64;
                this.samples[h + u] = g;
                e.position += g.length;
              }
            } else {
              this.samples.length = h;
              e.position = p + y;
              r = e.readUint();
              S = (r >> 5) + 15;
              c = e.position;
              r += c;
            }
            g = n();
            this.samples[0] = g;
            e.position = p + l;
            for (u = 1; u < h; ++u) {
              g = n();
              g.waveform = e.readUint();
              for (l = 0; l < 16; ++l) g.arpeggio[l] = e.readUbyte();
              g.attackSpeed = e.readUbyte();
              g.attackMax = e.readUbyte();
              g.decaySpeed = e.readUbyte();
              g.decayMin = e.readUbyte();
              g.sustain = e.readUbyte();
              e.readByte();
              g.releaseSpeed = e.readUbyte();
              g.releaseMin = e.readUbyte();
              g.phaseShift = e.readUbyte();
              g.phaseSpeed = e.readUbyte();
              g.finetune = e.readUbyte();
              g.pitchFall = e.readByte();
              if (T == d) {
                g.pitchFall = g.finetune;
                g.finetune = 0;
              } else {
                if (g.finetune > 15) g.finetune = 0;
                g.finetune *= 67;
              }
              if (g.phaseShift > x) {
                g.phaseShift = 0;
                g.phaseSpeed = 0;
              }
              if (g.waveform > 15) {
                if (S > 15 && g.waveform > S) {
                  g.waveform = 0;
                } else {
                  y = c + ((g.waveform - 16) << 5);
                  if (y >= e.length) continue;
                  l = e.position;
                  e.position = y;
                  g.pointer = e.readUint();
                  g.loop = e.readUint();
                  g.length = e.readUint();
                  g.name = e.readString(20);
                  if (
                    g.loop == 0 ||
                    g.loop == 99999 ||
                    g.loop == 199999 ||
                    g.loop >= g.length
                  ) {
                    g.loop = 0;
                    g.repeat = T == i ? 2 : 4;
                  } else {
                    g.repeat = g.length - g.loop;
                    g.loop -= g.pointer;
                  }
                  g.length -= g.pointer;
                  if (g.length < g.loop + g.repeat)
                    g.length = g.loop + g.repeat;
                  g.pointer = this.mixer.store(e, g.length, r + g.pointer);
                  if (g.repeat < 6 || g.loop == 0) g.loopPtr = 0;
                  else g.loopPtr = g.pointer + g.loop;
                  e.position = l;
                }
              } else if (g.waveform > x) {
                g.waveform = 0;
              }
              this.samples[u] = g;
            }
            e.position = p - 12;
            y = e.readUint();
            h = ((e.readUint() - y) / 5) >> 0;
            this.patterns.length = h;
            e.position = p + y;
            for (u = 0; u < h; ++u) {
              m = t();
              m.note = e.readUbyte();
              m.sample = e.readUbyte();
              m.effect = e.readUbyte();
              m.param = e.readUbyte();
              m.speed = e.readUbyte();
              if (T == d) {
                if (m.note > 0 && m.note < 255) m.note += 469;
                if (m.effect > 0 && m.effect < 255) m.effect += 469;
                if (m.sample > 59) m.sample = w + (m.sample - 60);
              } else if (m.sample > w) {
                m.sample = 0;
              }
              this.patterns[u] = m;
            }
            if (T == s || T == o || T == d) {
              if (T == s) this.mix1Speed = this.mix2Speed = 0;
              this.doReset = this.doFilter = 0;
            } else {
              this.doReset = this.doFilter = 1;
            }
            this.version = 1;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i = this.mixer.memory,
              s,
              o,
              u,
              a,
              f,
              l,
              c = this.voices[0];
            while (c) {
              e = c.channel;
              this.audPtr = -1;
              this.audLen = this.audPer = this.audVol = 0;
              if (this.tick == 0) {
                if (this.patternEnd) {
                  if (this.trackEnd) c.step = this.tracksPtr[c.index];
                  else c.step++;
                  f = this.tracks[c.step];
                  c.row = this.patternsPtr[f.pattern];
                  if (this.doReset) c.noteTimer = 0;
                }
                if (c.noteTimer == 0) {
                  s = this.patterns[c.row];
                  if (s.sample == 0) {
                    if (s.note) {
                      c.noteTimer = s.speed;
                      if (c.waitCtr) {
                        o = this.samples[c.sample];
                        this.audPtr = o.pointer;
                        this.audLen = o.length;
                        c.samplePtr = o.loopPtr;
                        c.sampleLen = o.repeat;
                        c.waitCtr = 1;
                        e.enabled = 0;
                      }
                    }
                  } else {
                    o = this.samples[s.sample];
                    if (c.waitCtr) e.enabled = c.waitCtr = 0;
                    if (o.waveform > 15) {
                      this.audPtr = o.pointer;
                      this.audLen = o.length;
                      c.samplePtr = o.loopPtr;
                      c.sampleLen = o.repeat;
                      c.waitCtr = 1;
                    } else {
                      c.wavePos = 0;
                      c.waveList = o.waveform;
                      r = c.waveList << 4;
                      this.audPtr = this.waveLists[r] << 5;
                      this.audLen = 32;
                      c.waveTimer = this.waveLists[++r];
                    }
                    c.noteTimer = s.speed;
                    c.sample = s.sample;
                    c.envelopeCtr = c.pitchCtr = c.pitchFallCtr = 0;
                  }
                  if (s.note) {
                    c.noteTimer = s.speed;
                    if (s.note != 255) {
                      o = this.samples[c.sample];
                      f = this.tracks[c.step];
                      c.note = s.note + f.transpose;
                      c.period = this.audPer = m[1 + o.finetune + c.note];
                      c.phaseSpeed = o.phaseSpeed;
                      c.bendSpeed = c.volume = 0;
                      c.envelopeCtr = c.pitchCtr = c.pitchFallCtr = 0;
                      switch (s.effect) {
                        case 0:
                          if (s.param == 0) break;
                          o.attackSpeed = s.param;
                          o.attackMax = s.param;
                          c.waveTimer = 0;
                          break;
                        case 2:
                          this.speed = s.param;
                          c.waveTimer = 0;
                          break;
                        case 3:
                          this.patternLen = s.param;
                          c.waveTimer = 0;
                          break;
                        default:
                          c.bendTo = s.effect + f.transpose;
                          c.bendSpeed = s.param;
                          break;
                      }
                    }
                  }
                  c.row++;
                } else {
                  c.noteTimer--;
                }
              }
              o = this.samples[c.sample];
              this.audVol = c.volume;
              switch (c.envelopeCtr) {
                case 8:
                  break;
                case 0:
                  this.audVol += o.attackSpeed;
                  if (this.audVol > o.attackMax) {
                    this.audVol = o.attackMax;
                    c.envelopeCtr += 2;
                  }
                  break;
                case 2:
                  this.audVol -= o.decaySpeed;
                  if (this.audVol <= o.decayMin || this.audVol < -256) {
                    this.audVol = o.decayMin;
                    c.envelopeCtr += 2;
                    c.sustainCtr = o.sustain;
                  }
                  break;
                case 4:
                  c.sustainCtr--;
                  if (c.sustainCtr == 0 || c.sustainCtr == -256)
                    c.envelopeCtr += 2;
                  break;
                case 6:
                  this.audVol -= o.releaseSpeed;
                  if (this.audVol <= o.releaseMin || this.audVol < -256) {
                    this.audVol = o.releaseMin;
                    c.envelopeCtr = 8;
                  }
                  break;
              }
              c.volume = this.audVol;
              c.arpeggioCtr = ++c.arpeggioCtr & 15;
              r = o.finetune + o.arpeggio[c.arpeggioCtr] + c.note;
              c.period = this.audPer = m[r];
              if (c.bendSpeed) {
                l = m[o.finetune + c.bendTo];
                r = ~c.bendSpeed + 1;
                if (r < -128) r &= 255;
                c.pitchCtr += r;
                c.period += c.pitchCtr;
                if ((r < 0 && c.period <= l) || (r > 0 && c.period >= l)) {
                  c.note = c.bendTo;
                  c.period = l;
                  c.bendSpeed = 0;
                  c.pitchCtr = 0;
                }
              }
              if (o.phaseShift) {
                if (c.phaseSpeed) {
                  c.phaseSpeed--;
                } else {
                  c.phaseTimer = ++c.phaseTimer & 31;
                  r = (o.phaseShift << 5) + c.phaseTimer;
                  c.period += i[r] >> 2;
                }
              }
              c.pitchFallCtr -= o.pitchFall;
              if (c.pitchFallCtr < -256) c.pitchFallCtr += 256;
              c.period += c.pitchFallCtr;
              if (c.waitCtr == 0) {
                if (c.waveTimer) {
                  c.waveTimer--;
                } else {
                  if (c.wavePos < 16) {
                    r = (c.waveList << 4) + c.wavePos;
                    l = this.waveLists[r++];
                    if (l == 255) {
                      c.wavePos = this.waveLists[r] & 254;
                    } else {
                      this.audPtr = l << 5;
                      c.waveTimer = this.waveLists[r];
                      c.wavePos += 2;
                    }
                  }
                }
              }
              if (this.audPtr > -1) e.pointer = this.audPtr;
              if (this.audPer != 0) e.period = c.period;
              if (this.audLen != 0) e.length = this.audLen;
              if (o.volume) e.volume = o.volume;
              else e.volume = this.audVol >> 2;
              e.enabled = 1;
              c = c.next;
            }
            this.trackEnd = this.patternEnd = 0;
            if (++this.tick > this.speed) {
              this.tick = 0;
              if (++this.patternPos == this.patternLen) {
                this.patternPos = 0;
                this.patternEnd = 1;
                if (++this.trackPos == this.trackLen)
                  this.trackPos = this.trackEnd = this.mixer.complete = 1;
              }
            }
            if (this.mix1Speed) {
              if (this.mix1Ctr == 0) {
                this.mix1Ctr = this.mix1Speed;
                r = this.mix1Pos = ++this.mix1Pos & 31;
                t = (this.mix1Dest << 5) + 31;
                u = (this.mix1Source1 << 5) + 31;
                a = this.mix1Source2 << 5;
                for (n = 31; n > -1; --n) {
                  i[t--] = (i[u--] + i[a + r]) >> 1;
                  r = --r & 31;
                }
              }
              this.mix1Ctr--;
            }
            if (this.mix2Speed) {
              if (this.mix2Ctr == 0) {
                this.mix2Ctr = this.mix2Speed;
                r = this.mix2Pos = ++this.mix2Pos & 31;
                t = (this.mix2Dest << 5) + 31;
                u = (this.mix2Source1 << 5) + 31;
                a = this.mix2Source2 << 5;
                for (n = 31; n > -1; --n) {
                  i[t--] = (i[u--] + i[a + r]) >> 1;
                  r = --r & 31;
                }
              }
              this.mix2Ctr--;
            }
            if (this.doFilter) {
              r = this.mix1Pos + 32;
              i[r] = ~i[r] + 1;
            }
            c = this.voices[0];
            while (c) {
              e = c.channel;
              if (c.waitCtr == 1) {
                c.waitCtr++;
              } else if (c.waitCtr == 2) {
                c.waitCtr++;
                e.pointer = c.samplePtr;
                e.length = c.sampleLen;
              }
              c = c.next;
            }
          },
        },
      });
      u.voices[0] = e(0);
      u.voices[0].next = u.voices[1] = e(1);
      u.voices[1].next = u.voices[2] = e(2);
      u.voices[2].next = u.voices[3] = e(3);
      u.tracksPtr = new Uint32Array(4);
      return Object.seal(u);
    }
    var i = 4090,
      s = 4464,
      o = 4550,
      l = 4572,
      h = 4576,
      p = 4698,
      d = 5188,
      v = [1166, 408, 908],
      m = [
        0, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3616, 3424, 3232,
        3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1808, 1712, 1616,
        1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 904, 856, 808, 762,
        720, 678, 640, 604, 570, 538, 508, 480, 452, 428, 404, 381, 360, 339,
        320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151,
        143, 135, 127, 0, 0, 0, 0, 0, 0, 0, 4028, 3806, 3584, 3394, 3204, 3013,
        2855, 2696, 2538, 2395, 2268, 2141, 2014, 1903, 1792, 1697, 1602, 1507,
        1428, 1348, 1269, 1198, 1134, 1071, 1007, 952, 896, 849, 801, 754, 714,
        674, 635, 599, 567, 536, 504, 476, 448, 425, 401, 377, 357, 337, 310,
        300, 284, 268, 252, 238, 224, 213, 201, 189, 179, 169, 159, 150, 142,
        134, 0, 0, 0, 0, 0, 0, 0, 3993, 3773, 3552, 3364, 3175, 2987, 2830,
        2672, 2515, 2374, 2248, 2122, 1997, 1887, 1776, 1682, 1588, 1494, 1415,
        1336, 1258, 1187, 1124, 1061, 999, 944, 888, 841, 794, 747, 708, 668,
        629, 594, 562, 531, 500, 472, 444, 421, 397, 374, 354, 334, 315, 297,
        281, 266, 250, 236, 222, 211, 199, 187, 177, 167, 158, 149, 141, 133, 0,
        0, 0, 0, 0, 0, 0, 3957, 3739, 3521, 3334, 3147, 2960, 2804, 2648, 2493,
        2353, 2228, 2103, 1979, 1870, 1761, 1667, 1574, 1480, 1402, 1324, 1247,
        1177, 1114, 1052, 990, 935, 881, 834, 787, 740, 701, 662, 624, 589, 557,
        526, 495, 468, 441, 417, 394, 370, 351, 331, 312, 295, 279, 263, 248,
        234, 221, 209, 197, 185, 176, 166, 156, 148, 140, 132, 0, 0, 0, 0, 0, 0,
        0, 3921, 3705, 3489, 3304, 3119, 2933, 2779, 2625, 2470, 2331, 2208,
        2084, 1961, 1853, 1745, 1652, 1560, 1467, 1390, 1313, 1235, 1166, 1104,
        1042, 981, 927, 873, 826, 780, 734, 695, 657, 618, 583, 552, 521, 491,
        464, 437, 413, 390, 367, 348, 329, 309, 292, 276, 261, 246, 232, 219,
        207, 195, 184, 174, 165, 155, 146, 138, 131, 0, 0, 0, 0, 0, 0, 0, 3886,
        3671, 3457, 3274, 3090, 2907, 2754, 2601, 2448, 2310, 2188, 2065, 1943,
        1836, 1729, 1637, 1545, 1454, 1377, 1301, 1224, 1155, 1094, 1033, 972,
        918, 865, 819, 773, 727, 689, 651, 612, 578, 547, 517, 486, 459, 433,
        410, 387, 364, 345, 326, 306, 289, 274, 259, 243, 230, 217, 205, 194,
        182, 173, 163, 153, 145, 137, 130, 0, 0, 0, 0, 0, 0, 0, 3851, 3638,
        3426, 3244, 3062, 2880, 2729, 2577, 2426, 2289, 2168, 2047, 1926, 1819,
        1713, 1622, 1531, 1440, 1365, 1289, 1213, 1145, 1084, 1024, 963, 910,
        857, 811, 766, 720, 683, 645, 607, 573, 542, 512, 482, 455, 429, 406,
        383, 360, 342, 323, 304, 287, 271, 256, 241, 228, 215, 203, 192, 180,
        171, 162, 152, 144, 136, 128, 6848, 6464, 6096, 5760, 5424, 5120, 4832,
        4560, 4304, 4064, 3840, 3616, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
        2280, 2152, 2032, 1920, 1808, 1712, 1616, 1524, 1440, 1356, 1280, 1208,
        1140, 1076, 1016, 960, 904, 856, 808, 762, 720, 678, 640, 604, 570, 538,
        508, 480, 452, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240,
        226, 214, 202, 190, 180, 170, 160, 151, 143, 135, 127,
      ];
    window.neoart.S1Player = r;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        step: { value: null, writable: true },
        row: { value: null, writable: true },
        instr: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        pattern: { value: 0, writable: true },
        instrument: { value: 0, writable: true },
        note: { value: 0, writable: true },
        period: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        original: { value: 0, writable: true },
        adsrPos: { value: 0, writable: true },
        sustainCtr: { value: 0, writable: true },
        pitchBend: { value: 0, writable: true },
        pitchBendCtr: { value: 0, writable: true },
        noteSlideTo: { value: 0, writable: true },
        noteSlideSpeed: { value: 0, writable: true },
        waveCtr: { value: 0, writable: true },
        wavePos: { value: 0, writable: true },
        arpeggioCtr: { value: 0, writable: true },
        arpeggioPos: { value: 0, writable: true },
        vibratoCtr: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        speed: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.step = null;
            this.row = null;
            this.instr = null;
            this.sample = null;
            this.enabled = 0;
            this.pattern = 0;
            this.instrument = 0;
            this.note = 0;
            this.period = 0;
            this.volume = 0;
            this.original = 0;
            this.adsrPos = 0;
            this.sustainCtr = 0;
            this.pitchBend = 0;
            this.pitchBendCtr = 0;
            this.noteSlideTo = 0;
            this.noteSlideSpeed = 0;
            this.waveCtr = 0;
            this.wavePos = 0;
            this.arpeggioCtr = 0;
            this.arpeggioPos = 0;
            this.vibratoCtr = 0;
            this.vibratoPos = 0;
            this.speed = 0;
          },
        },
      });
    }
    function t() {
      return Object.create(null, {
        wave: { value: 0, writable: true },
        waveLen: { value: 0, writable: true },
        waveDelay: { value: 0, writable: true },
        waveSpeed: { value: 0, writable: true },
        arpeggio: { value: 0, writable: true },
        arpeggioLen: { value: 0, writable: true },
        arpeggioDelay: { value: 0, writable: true },
        arpeggioSpeed: { value: 0, writable: true },
        vibrato: { value: 0, writable: true },
        vibratoLen: { value: 0, writable: true },
        vibratoDelay: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        pitchBend: { value: 0, writable: true },
        pitchBendDelay: { value: 0, writable: true },
        attackMax: { value: 0, writable: true },
        attackSpeed: { value: 0, writable: true },
        decayMin: { value: 0, writable: true },
        decaySpeed: { value: 0, writable: true },
        sustain: { value: 0, writable: true },
        releaseMin: { value: 0, writable: true },
        releaseSpeed: { value: 0, writable: true },
      });
    }
    function n() {
      var e = u();
      Object.defineProperties(e, { speed: { value: 0, writable: true } });
      return Object.seal(e);
    }
    function r() {
      var e = a();
      Object.defineProperties(e, {
        negStart: { value: 0, writable: true },
        negLen: { value: 0, writable: true },
        negSpeed: { value: 0, writable: true },
        negDir: { value: 0, writable: true },
        negOffset: { value: 0, writable: true },
        negPos: { value: 0, writable: true },
        negCtr: { value: 0, writable: true },
        negToggle: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function i() {
      var e = f();
      Object.defineProperties(e, {
        soundTranspose: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function s(s) {
      var u = c(s);
      Object.defineProperties(u, {
        id: { value: "S2Player" },
        tracks: { value: [], writable: true },
        patterns: { value: [], writable: true },
        instruments: { value: [], writable: true },
        samples: { value: [], writable: true },
        arpeggios: { value: null, writable: true },
        vibratos: { value: null, writable: true },
        waves: { value: null, writable: true },
        length: { value: 0, writable: true },
        speedDef: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        patternLen: { value: 0, writable: true },
        arpeggioFx: { value: null, writable: true },
        arpeggioPos: { value: 0, writable: true },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.speed = this.speedDef;
            this.tick = this.speedDef;
            this.trackPos = 0;
            this.patternPos = 0;
            this.patternLen = 64;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.instr = this.instruments[0];
              this.arpeggioFx[e.index] = 0;
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var s = 0,
              o = 0,
              u,
              a,
              f,
              l,
              c,
              h,
              p = 0,
              d,
              v,
              m,
              g,
              y;
            e.position = 58;
            u = e.readString(28);
            if (u != "SIDMON II - THE MIDI VERSION") return;
            e.position = 2;
            this.length = e.readUbyte();
            this.speedDef = e.readUbyte();
            this.samples.length = e.readUshort() >> 6;
            e.position = 14;
            l = e.readUint();
            this.tracks.length = l;
            e.position = 90;
            for (; o < l; ++o) {
              v = i();
              v.pattern = e.readUbyte();
              if (v.pattern > s) s = v.pattern;
              this.tracks[o] = v;
            }
            for (o = 0; o < l; ++o) {
              v = this.tracks[o];
              v.transpose = e.readByte();
            }
            for (o = 0; o < l; ++o) {
              v = this.tracks[o];
              v.soundTranspose = e.readByte();
            }
            h = e.position;
            e.position = 26;
            l = e.readUint() >> 5;
            this.instruments.length = ++l;
            e.position = h;
            this.instruments[0] = t();
            for (o = 0; ++o < l; ) {
              a = t();
              a.wave = e.readUbyte() << 4;
              a.waveLen = e.readUbyte();
              a.waveSpeed = e.readUbyte();
              a.waveDelay = e.readUbyte();
              a.arpeggio = e.readUbyte() << 4;
              a.arpeggioLen = e.readUbyte();
              a.arpeggioSpeed = e.readUbyte();
              a.arpeggioDelay = e.readUbyte();
              a.vibrato = e.readUbyte() << 4;
              a.vibratoLen = e.readUbyte();
              a.vibratoSpeed = e.readUbyte();
              a.vibratoDelay = e.readUbyte();
              a.pitchBend = e.readByte();
              a.pitchBendDelay = e.readUbyte();
              e.readByte();
              e.readByte();
              a.attackMax = e.readUbyte();
              a.attackSpeed = e.readUbyte();
              a.decayMin = e.readUbyte();
              a.decaySpeed = e.readUbyte();
              a.sustain = e.readUbyte();
              a.releaseMin = e.readUbyte();
              a.releaseSpeed = e.readUbyte();
              this.instruments[o] = a;
              e.position += 9;
            }
            h = e.position;
            e.position = 30;
            l = e.readUint();
            this.waves = new Uint8Array(l);
            e.position = h;
            for (o = 0; o < l; ++o) this.waves[o] = e.readUbyte();
            h = e.position;
            e.position = 34;
            l = e.readUint();
            this.arpeggios = new Int8Array(l);
            e.position = h;
            for (o = 0; o < l; ++o) this.arpeggios[o] = e.readByte();
            h = e.position;
            e.position = 38;
            l = e.readUint();
            this.vibratos = new Int8Array(l);
            e.position = h;
            for (o = 0; o < l; ++o) this.vibratos[o] = e.readByte();
            l = this.samples.length;
            h = 0;
            for (o = 0; o < l; ++o) {
              m = r();
              e.readUint();
              m.length = e.readUshort() << 1;
              m.loop = e.readUshort() << 1;
              m.repeat = e.readUshort() << 1;
              m.negStart = h + (e.readUshort() << 1);
              m.negLen = e.readUshort() << 1;
              m.negSpeed = e.readUshort();
              m.negDir = e.readUshort();
              m.negOffset = e.readShort();
              m.negPos = e.readUint();
              m.negCtr = e.readUshort();
              e.position += 6;
              m.name = e.readString(32);
              m.pointer = h;
              m.loopPtr = h + m.loop;
              h += m.length;
              this.samples[o] = m;
            }
            g = h;
            l = ++s;
            c = new Uint16Array(++s);
            for (o = 0; o < l; ++o) c[o] = e.readUshort();
            h = e.position;
            e.position = 50;
            l = e.readUint();
            this.patterns = [];
            e.position = h;
            f = 1;
            for (o = 0; o < l; ++o) {
              d = n();
              y = e.readByte();
              if (!y) {
                d.effect = e.readByte();
                d.param = e.readUbyte();
                o += 2;
              } else if (y < 0) {
                d.speed = ~y;
              } else if (y < 112) {
                d.note = y;
                y = e.readByte();
                o++;
                if (y < 0) {
                  d.speed = ~y;
                } else if (y < 112) {
                  d.sample = y;
                  y = e.readByte();
                  o++;
                  if (y < 0) {
                    d.speed = ~y;
                  } else {
                    d.effect = y;
                    d.param = e.readUbyte();
                    o++;
                  }
                } else {
                  d.effect = y;
                  d.param = e.readUbyte();
                  o++;
                }
              } else {
                d.effect = y;
                d.param = e.readUbyte();
                o++;
              }
              this.patterns[p++] = d;
              if (h + c[f] == e.position) c[f++] = p;
            }
            c[f] = this.patterns.length;
            if ((e.position & 1) != 0) e.position++;
            this.mixer.store(e, g);
            l = this.tracks.length;
            for (o = 0; o < l; ++o) {
              v = this.tracks[o];
              v.pattern = c[v.pattern];
            }
            this.length++;
            this.version = 2;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.voices[0];
            this.arpeggioPos = ++this.arpeggioPos & 3;
            if (++this.tick >= this.speed) {
              this.tick = 0;
              while (s) {
                e = s.channel;
                s.enabled = s.note = 0;
                if (!this.patternPos) {
                  s.step = this.tracks[this.trackPos + s.index * this.length];
                  s.pattern = s.step.pattern;
                  s.speed = 0;
                }
                if (--s.speed < 0) {
                  s.row = n = this.patterns[s.pattern++];
                  s.speed = n.speed;
                  if (n.note) {
                    s.enabled = 1;
                    s.note = n.note + s.step.transpose;
                    e.enabled = 0;
                  }
                }
                s.pitchBend = 0;
                if (s.note) {
                  s.waveCtr = s.sustainCtr = 0;
                  s.arpeggioCtr = s.arpeggioPos = 0;
                  s.vibratoCtr = s.vibratoPos = 0;
                  s.pitchBendCtr = s.noteSlideSpeed = 0;
                  s.adsrPos = 4;
                  s.volume = 0;
                  if (n.sample) {
                    s.instrument = n.sample;
                    s.instr =
                      this.instruments[s.instrument + s.step.soundTranspose];
                    s.sample = this.samples[this.waves[s.instr.wave]];
                  }
                  s.original = s.note + this.arpeggios[s.instr.arpeggio];
                  e.period = s.period = o[s.original];
                  r = s.sample;
                  e.pointer = r.pointer;
                  e.length = r.length;
                  e.enabled = s.enabled;
                  e.pointer = r.loopPtr;
                  e.length = r.repeat;
                }
                s = s.next;
              }
              if (++this.patternPos == this.patternLen) {
                this.patternPos = 0;
                if (++this.trackPos == this.length) {
                  this.trackPos = 0;
                  this.mixer.complete = 1;
                }
              }
            }
            s = this.voices[0];
            while (s) {
              if (!s.sample) {
                s = s.next;
                continue;
              }
              e = s.channel;
              r = s.sample;
              if (r.negToggle) {
                s = s.next;
                continue;
              }
              r.negToggle = 1;
              if (r.negCtr) {
                r.negCtr = --r.negCtr & 31;
              } else {
                r.negCtr = r.negSpeed;
                if (!r.negDir) {
                  s = s.next;
                  continue;
                }
                i = r.negStart + r.negPos;
                this.mixer.memory[i] = ~this.mixer.memory[i];
                r.negPos += r.negOffset;
                i = r.negLen - 1;
                if (r.negPos < 0) {
                  if (r.negDir == 2) {
                    r.negPos = i;
                  } else {
                    r.negOffset = -r.negOffset;
                    r.negPos += r.negOffset;
                  }
                } else if (i < r.negPos) {
                  if (r.negDir == 1) {
                    r.negPos = 0;
                  } else {
                    r.negOffset = -r.negOffset;
                    r.negPos += r.negOffset;
                  }
                }
              }
              s = s.next;
            }
            s = this.voices[0];
            while (s) {
              if (!s.sample) {
                s = s.next;
                continue;
              }
              s.sample.negToggle = 0;
              s = s.next;
            }
            s = this.voices[0];
            while (s) {
              e = s.channel;
              t = s.instr;
              switch (s.adsrPos) {
                case 0:
                  break;
                case 4:
                  s.volume += t.attackSpeed;
                  if (t.attackMax <= s.volume) {
                    s.volume = t.attackMax;
                    s.adsrPos--;
                  }
                  break;
                case 3:
                  if (!t.decaySpeed) {
                    s.adsrPos--;
                  } else {
                    s.volume -= t.decaySpeed;
                    if (t.decayMin >= s.volume) {
                      s.volume = t.decayMin;
                      s.adsrPos--;
                    }
                  }
                  break;
                case 2:
                  if (s.sustainCtr == t.sustain) s.adsrPos--;
                  else s.sustainCtr++;
                  break;
                case 1:
                  s.volume -= t.releaseSpeed;
                  if (t.releaseMin >= s.volume) {
                    s.volume = t.releaseMin;
                    s.adsrPos--;
                  }
                  break;
              }
              e.volume = s.volume >> 2;
              if (t.waveLen) {
                if (s.waveCtr == t.waveDelay) {
                  s.waveCtr = t.waveDelay - t.waveSpeed;
                  if (s.wavePos == t.waveLen) s.wavePos = 0;
                  else s.wavePos++;
                  s.sample = r = this.samples[this.waves[t.wave + s.wavePos]];
                  e.pointer = r.pointer;
                  e.length = r.length;
                } else s.waveCtr++;
              }
              if (t.arpeggioLen) {
                if (s.arpeggioCtr == t.arpeggioDelay) {
                  s.arpeggioCtr = t.arpeggioDelay - t.arpeggioSpeed;
                  if (s.arpeggioPos == t.arpeggioLen) s.arpeggioPos = 0;
                  else s.arpeggioPos++;
                  i = s.original + this.arpeggios[t.arpeggio + s.arpeggioPos];
                  s.period = o[i];
                } else s.arpeggioCtr++;
              }
              n = s.row;
              if (this.tick) {
                switch (n.effect) {
                  case 0:
                    break;
                  case 112:
                    this.arpeggioFx[0] = n.param >> 4;
                    this.arpeggioFx[2] = n.param & 15;
                    i = s.original + this.arpeggioFx[this.arpeggioPos];
                    s.period = o[i];
                    break;
                  case 113:
                    s.pitchBend = ~n.param + 1;
                    break;
                  case 114:
                    s.pitchBend = n.param;
                    break;
                  case 115:
                    if (s.adsrPos != 0) break;
                    if (s.instrument != 0) s.volume = t.attackMax;
                    s.volume += n.param << 2;
                    if (s.volume >= 256) s.volume = -1;
                    break;
                  case 116:
                    if (s.adsrPos != 0) break;
                    if (s.instrument != 0) s.volume = t.attackMax;
                    s.volume -= n.param << 2;
                    if (s.volume < 0) s.volume = 0;
                    break;
                }
              }
              switch (n.effect) {
                case 0:
                  break;
                case 117:
                  t.attackMax = n.param;
                  t.attackSpeed = n.param;
                  break;
                case 118:
                  this.patternLen = n.param;
                  break;
                case 124:
                  e.volume = n.param;
                  s.volume = n.param << 2;
                  if (s.volume >= 255) s.volume = 255;
                  break;
                case 127:
                  i = n.param & 15;
                  if (i) this.speed = i;
                  break;
              }
              if (t.vibratoLen) {
                if (s.vibratoCtr == t.vibratoDelay) {
                  s.vibratoCtr = t.vibratoDelay - t.vibratoSpeed;
                  if (s.vibratoPos == t.vibratoLen) s.vibratoPos = 0;
                  else s.vibratoPos++;
                  s.period += this.vibratos[t.vibrato + s.vibratoPos];
                } else s.vibratoCtr++;
              }
              if (t.pitchBend) {
                if (s.pitchBendCtr == t.pitchBendDelay) {
                  s.pitchBend += t.pitchBend;
                } else s.pitchBendCtr++;
              }
              if (n.param) {
                if (n.effect && n.effect < 112) {
                  s.noteSlideTo = o[n.effect + s.step.transpose];
                  i = n.param;
                  if (s.noteSlideTo - s.period < 0) i = -i;
                  s.noteSlideSpeed = i;
                }
              }
              if (s.noteSlideTo && s.noteSlideSpeed) {
                s.period += s.noteSlideSpeed;
                if (
                  (s.noteSlideSpeed < 0 && s.period < s.noteSlideTo) ||
                  (s.noteSlideSpeed > 0 && s.period > s.noteSlideTo)
                ) {
                  s.noteSlideSpeed = 0;
                  s.period = s.noteSlideTo;
                }
              }
              s.period += s.pitchBend;
              if (s.period < 95) s.period = 95;
              else if (s.period > 5760) s.period = 5760;
              e.period = s.period;
              s = s.next;
            }
          },
        },
      });
      u.voices[0] = e(0);
      u.voices[0].next = u.voices[1] = e(1);
      u.voices[1].next = u.voices[2] = e(2);
      u.voices[2].next = u.voices[3] = e(3);
      u.arpeggioFx = new Uint8Array(4);
      return Object.seal(u);
    }
    var o = [
      0, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3616, 3424, 3232, 3048,
      2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1808, 1712, 1616, 1524,
      1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 904, 856, 808, 762, 720,
      678, 640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302,
      285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143, 135, 127,
      120, 113, 107, 101, 95,
    ];
    window.neoart.S2Player = s;
  })();
  (function () {
    function e(e) {
      return Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        channel: { value: null, writable: true },
        sample: { value: null, writable: true },
        enabled: { value: 0, writable: true },
        period: { value: 0, writable: true },
        last: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
        initialize: {
          value: function () {
            this.channel = null;
            this.sample = null;
            this.enabled = 0;
            this.period = 0;
            this.last = 0;
            this.effect = 0;
            this.param = 0;
          },
        },
      });
    }
    function t(t) {
      var f = c(t);
      Object.defineProperties(f, {
        id: { value: "STPlayer" },
        standard: { value: 0, writable: true },
        track: { value: null, writable: true },
        patterns: { value: [], writable: true },
        samples: { value: [], writable: true },
        length: { value: 0, writable: true },
        voices: { value: [], writable: true },
        trackPos: { value: 0, writable: true },
        patternPos: { value: 0, writable: true },
        jumpFlag: { value: 0, writable: true },
        force: {
          set: function (e) {
            if (e < n) e = n;
            else if (e > s) e = s;
            this.version = e;
          },
        },
        ntsc: {
          set: function (e) {
            this.standard = e;
            this.frequency(e);
            if (this.version < r) {
              e = e ? 20.44952532 : 20.637767904;
              e = (e * (this.sampleRate / 1e3)) / 120;
              this.mixer.samplesTick = ((240 - this.tempo) * e) >> 0;
            }
          },
        },
        initialize: {
          value: function () {
            var e = this.voices[0];
            this.reset();
            this.ntsc = this.standard;
            this.speed = 6;
            this.trackPos = 0;
            this.patternPos = 0;
            this.jumpFlag = 0;
            while (e) {
              e.initialize();
              e.channel = this.mixer.channels[e.index];
              e.sample = this.samples[0];
              e = e.next;
            }
          },
        },
        loader: {
          value: function (e) {
            var t = 0,
              o,
              f,
              l,
              c,
              h = 0,
              p = 0,
              d;
            if (e.length < 1626) return;
            this.title = e.readString(20);
            h += this.isLegal(this.title);
            this.version = n;
            e.position = 42;
            for (o = 1; o < 16; ++o) {
              d = e.readUshort();
              if (!d) {
                this.samples[o] = null;
                e.position += 28;
                continue;
              }
              c = a();
              e.position -= 24;
              c.name = e.readString(22);
              c.length = d << 1;
              e.position += 3;
              c.volume = e.readUbyte();
              c.loop = e.readUshort();
              c.repeat = e.readUshort() << 1;
              e.position += 22;
              c.pointer = p;
              p += c.length;
              this.samples[o] = c;
              h += this.isLegal(c.name);
              if (c.length > 9999) this.version = i;
            }
            e.position = 470;
            this.length = e.readUbyte();
            this.tempo = e.readUbyte();
            for (o = 0; o < 128; ++o) {
              d = e.readUbyte() << 8;
              if (d > 16384) h--;
              this.track[o] = d;
              if (d > t) t = d;
            }
            e.position = 600;
            t += 256;
            this.patterns.length = t;
            o = (e.length - p - 600) >> 2;
            if (t > o) t = o;
            for (o = 0; o < t; ++o) {
              l = u();
              l.note = e.readUshort();
              d = e.readUbyte();
              l.param = e.readUbyte();
              l.effect = d & 15;
              l.sample = d >> 4;
              this.patterns[o] = l;
              if (l.effect > 2 && l.effect < 11) h--;
              if (l.note) {
                if (l.note < 113 || l.note > 856) h--;
              }
              if (l.sample) {
                if (l.sample > 15 || !this.samples[l.sample]) {
                  if (l.sample > 15) h--;
                  l.sample = 0;
                }
              }
              if (l.effect > 2 || (!l.effect && l.param != 0)) this.version = r;
              if (l.effect == 11 || l.effect == 13) this.version = s;
            }
            this.mixer.store(e, p);
            for (o = 1; o < 16; ++o) {
              c = this.samples[o];
              if (!c) continue;
              if (c.loop) {
                c.loopPtr = c.pointer + c.loop;
                c.pointer = c.loopPtr;
                c.length = c.repeat;
              } else {
                c.loopPtr = this.mixer.memory.length;
                c.repeat = 2;
              }
              p = c.pointer + 4;
              for (f = c.pointer; f < p; ++f) this.mixer.memory[f] = 0;
            }
            c = a();
            c.pointer = c.loopPtr = this.mixer.memory.length;
            c.length = c.repeat = 2;
            this.samples[0] = c;
            if (h < 1) this.version = 0;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              r,
              i,
              o = this.voices[0];
            if (!this.tick) {
              i = this.track[this.trackPos] + this.patternPos;
              while (o) {
                e = o.channel;
                o.enabled = 0;
                t = this.patterns[i + o.index];
                o.period = t.note;
                o.effect = t.effect;
                o.param = t.param;
                if (t.sample) {
                  r = o.sample = this.samples[t.sample];
                  if ((this.version & 2) == 2 && o.effect == 12)
                    e.volume = o.param;
                  else e.volume = r.volume;
                } else {
                  r = o.sample;
                }
                if (o.period) {
                  o.enabled = 1;
                  e.enabled = 0;
                  e.pointer = r.pointer;
                  e.length = r.length;
                  e.period = o.last = o.period;
                }
                if (o.enabled) e.enabled = 1;
                e.pointer = r.loopPtr;
                e.length = r.repeat;
                if (this.version < s) {
                  o = o.next;
                  continue;
                }
                switch (o.effect) {
                  case 11:
                    this.trackPos = o.param - 1;
                    this.jumpFlag ^= 1;
                    break;
                  case 12:
                    e.volume = o.param;
                    break;
                  case 13:
                    this.jumpFlag ^= 1;
                    break;
                  case 14:
                    this.mixer.filter.active = o.param ^ 1;
                    break;
                  case 15:
                    if (!o.param) break;
                    this.speed = o.param & 15;
                    this.tick = 0;
                    break;
                }
                o = o.next;
              }
            } else {
              while (o) {
                if (!o.param) {
                  o = o.next;
                  continue;
                }
                e = o.channel;
                if (this.version == n) {
                  if (o.effect == 1) {
                    this.arpeggio(o);
                  } else if (o.effect == 2) {
                    i = o.param >> 4;
                    if (i) o.period += i;
                    else o.period -= o.param & 15;
                    e.period = o.period;
                  }
                } else {
                  switch (o.effect) {
                    case 0:
                      this.arpeggio(o);
                      break;
                    case 1:
                      o.last -= o.param & 15;
                      if (o.last < 113) o.last = 113;
                      e.period = o.last;
                      break;
                    case 2:
                      o.last += o.param & 15;
                      if (o.last > 856) o.last = 856;
                      e.period = o.last;
                      break;
                  }
                  if ((this.version & 2) != 2) {
                    o = o.next;
                    continue;
                  }
                  switch (o.effect) {
                    case 12:
                      e.volume = o.param;
                      break;
                    case 13:
                      this.mixer.filter.active = 0;
                      break;
                    case 14:
                      this.speed = o.param & 15;
                      break;
                  }
                }
                o = o.next;
              }
            }
            if (++this.tick == this.speed) {
              this.tick = 0;
              this.patternPos += 4;
              if (this.patternPos == 256 || this.jumpFlag) {
                this.patternPos = this.jumpFlag = 0;
                if (++this.trackPos == this.length) {
                  this.trackPos = 0;
                  this.mixer.complete = 1;
                }
              }
            }
          },
        },
        arpeggio: {
          value: function (e) {
            var t = e.channel,
              n = 0,
              r = this.tick % 3;
            if (!r) {
              t.period = e.last;
              return;
            }
            if (r == 1) r = e.param >> 4;
            else r = e.param & 15;
            while (e.last != o[n]) n++;
            t.period = o[n + r];
          },
        },
        isLegal: {
          value: function (e) {
            var t,
              n = 0,
              r = e.length;
            if (!r) return 0;
            for (; n < r; ++n) {
              t = e.charCodeAt(n);
              if (t && (t < 32 || t > 127)) return 0;
            }
            return 1;
          },
        },
      });
      f.voices[0] = e(0);
      f.voices[0].next = f.voices[1] = e(1);
      f.voices[1].next = f.voices[2] = e(2);
      f.voices[2].next = f.voices[3] = e(3);
      f.track = new Uint16Array(128);
      return Object.seal(f);
    }
    var n = 1,
      r = 2,
      i = 3,
      s = 4,
      o = [
        856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
        381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
        170, 160, 151, 143, 135, 127, 120, 113, 0, 0, 0,
      ];
    window.neoart.STPlayer = t;
  })();
  (function () {
    function e(e) {
      var t = Object.create(null, {
        index: { value: e, writable: true },
        next: { value: null, writable: true },
        flags: { value: 0, writable: true },
        delay: { value: 0, writable: true },
        channel: { value: null, writable: true },
        patternLoop: { value: 0, writable: true },
        patternLoopRow: { value: 0, writable: true },
        playing: { value: null, writable: true },
        note: { value: 0, writable: true },
        keyoff: { value: 0, writable: true },
        period: { value: 0, writable: true },
        finetune: { value: 0, writable: true },
        arpDelta: { value: 0, writable: true },
        vibDelta: { value: 0, writable: true },
        instrument: { value: null, writable: true },
        autoVibratoPos: { value: 0, writable: true },
        autoSweep: { value: 0, writable: true },
        autoSweepPos: { value: 0, writable: true },
        sample: { value: null, writable: true },
        sampleOffset: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        volEnabled: { value: 0, writable: true },
        volEnvelope: { value: null, writable: true },
        volDelta: { value: 0, writable: true },
        volSlide: { value: 0, writable: true },
        volSlideMaster: { value: 0, writable: true },
        fineSlideU: { value: 0, writable: true },
        fineSlideD: { value: 0, writable: true },
        fadeEnabled: { value: 0, writable: true },
        fadeDelta: { value: 0, writable: true },
        fadeVolume: { value: 0, writable: true },
        panning: { value: 0, writable: true },
        panEnabled: { value: 0, writable: true },
        panEnvelope: { value: null, writable: true },
        panSlide: { value: 0, writable: true },
        portaU: { value: 0, writable: true },
        portaD: { value: 0, writable: true },
        finePortaU: { value: 0, writable: true },
        finePortaD: { value: 0, writable: true },
        xtraPortaU: { value: 0, writable: true },
        xtraPortaD: { value: 0, writable: true },
        portaPeriod: { value: 0, writable: true },
        portaSpeed: { value: 0, writable: true },
        glissando: { value: 0, writable: true },
        glissPeriod: { value: 0, writable: true },
        vibratoPos: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
        vibratoReset: { value: 0, writable: true },
        tremoloPos: { value: 0, writable: true },
        tremoloSpeed: { value: 0, writable: true },
        tremoloDepth: { value: 0, writable: true },
        waveControl: { value: 0, writable: true },
        tremorPos: { value: 0, writable: true },
        tremorOn: { value: 0, writable: true },
        tremorOff: { value: 0, writable: true },
        tremorVolume: { value: 0, writable: true },
        retrigx: { value: 0, writable: true },
        retrigy: { value: 0, writable: true },
        reset: {
          value: function () {
            this.volume = this.sample.volume;
            this.panning = this.sample.panning;
            this.finetune = (this.sample.finetune >> 3) << 2;
            this.keyoff = 0;
            this.volDelta = 0;
            this.fadeEnabled = 0;
            this.fadeDelta = 0;
            this.fadeVolume = 65536;
            this.autoVibratoPos = 0;
            this.autoSweep = 1;
            this.autoSweepPos = 0;
            this.vibDelta = 0;
            this.vibratoReset = 0;
            if ((this.waveControl & 15) < 4) this.vibratoPos = 0;
            if (this.waveControl >> 4 < 4) this.tremoloPos = 0;
          },
        },
        autoVibrato: {
          value: function () {
            var e;
            this.autoVibratoPos =
              (this.autoVibratoPos + this.playing.vibratoSpeed) & 255;
            switch (this.playing.vibratoType) {
              case 0:
                e = x[this.autoVibratoPos];
                break;
              case 1:
                if (this.autoVibratoPos < 128) e = -64;
                else e = 64;
                break;
              case 2:
                e = ((64 + (this.autoVibratoPos >> 1)) & 127) - 64;
                break;
              case 3:
                e = ((64 - (this.autoVibratoPos >> 1)) & 127) - 64;
                break;
            }
            e *= this.playing.vibratoDepth;
            if (this.autoSweep) {
              if (!this.playing.vibratoSweep) {
                this.autoSweep = 0;
              } else {
                if (this.autoSweepPos > this.playing.vibratoSweep) {
                  if (this.autoSweepPos & 2)
                    e *= this.autoSweepPos / this.playing.vibratoSweep;
                  this.autoSweep = 0;
                } else {
                  e *= ++this.autoSweepPos / this.playing.vibratoSweep;
                }
              }
            }
            this.flags |= f;
            return e >> 6;
          },
        },
        tonePortamento: {
          value: function () {
            if (!this.glissPeriod) this.glissPeriod = this.period;
            if (this.period < this.portaPeriod) {
              this.glissPeriod += this.portaSpeed << 2;
              if (!this.glissando) this.period = this.glissPeriod;
              else this.period = Math.round(this.glissPeriod / 64) << 6;
              if (this.period >= this.portaPeriod) {
                this.period = this.portaPeriod;
                this.glissPeriod = this.portaPeriod = 0;
              }
            } else if (this.period > this.portaPeriod) {
              this.glissPeriod -= this.portaSpeed << 2;
              if (!this.glissando) this.period = this.glissPeriod;
              else this.period = Math.round(this.glissPeriod / 64) << 6;
              if (this.period <= this.portaPeriod) {
                this.period = this.portaPeriod;
                this.glissPeriod = this.portaPeriod = 0;
              }
            }
            this.flags |= f;
          },
        },
        tremolo: {
          value: function () {
            var e = 255,
              t = this.tremoloPos & 31;
            switch ((this.waveControl >> 4) & 3) {
              case 0:
                e = T[t];
                break;
              case 1:
                e = t << 3;
                break;
            }
            this.volDelta = (e * this.tremoloDepth) >> 6;
            if (this.tremoloPos > 31) this.volDelta = -this.volDelta;
            this.tremoloPos = (this.tremoloPos + this.tremoloSpeed) & 63;
            this.flags |= l;
          },
        },
        tremor: {
          value: function () {
            if (this.tremorPos == this.tremorOn) {
              this.tremorVolume = this.volume;
              this.volume = 0;
              this.flags |= l;
            } else {
              this.tremorPos = 0;
              this.volume = this.tremorVolume;
              this.flags |= l;
            }
            this.tremorPos++;
          },
        },
        vibrato: {
          value: function () {
            var e = 255,
              t = this.vibratoPos & 31;
            switch (this.waveControl & 3) {
              case 0:
                e = T[t];
                break;
              case 1:
                e = t << 3;
                if (this.vibratoPos > 31) e = 255 - e;
                break;
            }
            this.vibDelta = (e * this.vibratoDepth) >> 7;
            if (this.vibratoPos > 31) this.vibDelta = -this.vibDelta;
            this.vibratoPos = (this.vibratoPos + this.vibratoSpeed) & 63;
            this.flags |= f;
          },
        },
      });
      t.volEnvelope = n();
      t.panEnvelope = n();
      return Object.seal(t);
    }
    function t() {
      return Object.create(null, {
        points: { value: [], writable: true },
        total: { value: 0, writable: true },
        sustain: { value: 0, writable: true },
        loopStart: { value: 0, writable: true },
        loopEnd: { value: 0, writable: true },
        flags: { value: 0, writable: true },
      });
    }
    function n() {
      return Object.create(null, {
        value: { value: 0, writable: true },
        position: { value: 0, writable: true },
        frame: { value: 0, writable: true },
        delta: { value: 0, writable: true },
        fraction: { value: 0, writable: true },
        stopped: { value: 0, writable: true },
        reset: {
          value: function () {
            this.value = 0;
            this.position = 0;
            this.frame = 0;
            this.delta = 0;
            this.fraction = 0;
            this.stopped = 0;
          },
        },
      });
    }
    function r() {
      var e = Object.create(null, {
        name: { value: "", writable: true },
        samples: { value: [], writable: true },
        noteSamples: { value: null, writable: true },
        fadeout: { value: 0, writable: true },
        volData: { value: null, writable: true },
        volEnabled: { value: 0, writable: true },
        panData: { value: null, writable: true },
        panEnabled: { value: 0, writable: true },
        vibratoType: { value: 0, writable: true },
        vibratoSweep: { value: 0, writable: true },
        vibratoSpeed: { value: 0, writable: true },
        vibratoDepth: { value: 0, writable: true },
      });
      e.noteSamples = new Uint8Array(96);
      e.volData = t();
      e.panData = t();
      return Object.seal(e);
    }
    function i(e, t) {
      var n = Object.create(null, {
        rows: { value: [], writable: true },
        length: { value: 0, writable: true },
        size: { value: 0, writable: true },
      });
      n.rows.length = n.size = e * t;
      n.length = e;
      return Object.seal(n);
    }
    function s(e, t) {
      var n = Object.create(null, {
        frame: { value: 0, writable: true },
        value: { value: 0, writable: true },
      });
      n.frame = e || 0;
      n.value = t || 0;
      return Object.seal(n);
    }
    function o() {
      return Object.create(null, {
        note: { value: 0, writable: true },
        instrument: { value: 0, writable: true },
        volume: { value: 0, writable: true },
        effect: { value: 0, writable: true },
        param: { value: 0, writable: true },
      });
    }
    function u() {
      var e = p();
      Object.defineProperties(e, {
        finetune: { value: 0, writable: true },
        panning: { value: 0, writable: true },
        relative: { value: 0, writable: true },
      });
      return Object.seal(e);
    }
    function a(n) {
      var a = v(n);
      Object.defineProperties(a, {
        id: { value: "F2Player" },
        patterns: { value: [], writable: true },
        instruments: { value: [], writable: true },
        voices: { value: [], writable: true },
        linear: { value: 0, writable: true },
        complete: { value: 0, writable: true },
        order: { value: 0, writable: true },
        position: { value: 0, writable: true },
        nextOrder: { value: 0, writable: true },
        nextPosition: { value: 0, writable: true },
        pattern: { value: null, writable: true },
        patternDelay: { value: 0, writable: true },
        patternOffset: { value: 0, writable: true },
        timer: { value: 0, writable: true },
        initialize: {
          value: function () {
            var t = 0,
              n;
            this.reset();
            this.timer = this.speed;
            this.order = 0;
            this.position = 0;
            this.nextOrder = -1;
            this.nextPosition = -1;
            this.patternDelay = 0;
            this.patternOffset = 0;
            this.complete = 0;
            this.master = 64;
            this.voices.length = this.channels;
            for (; t < this.channels; ++t) {
              n = e(t);
              n.channel = this.mixer.channels[t];
              n.playing = this.instruments[0];
              n.sample = n.playing.samples[0];
              this.voices[t] = n;
              if (t) this.voices[t - 1].next = n;
            }
          },
        },
        loader: {
          value: function (e) {
            var n,
              a,
              f,
              l,
              c,
              h,
              p,
              d,
              v,
              m,
              y = 22,
              b,
              w,
              E,
              x;
            if (e.length < 360) return;
            e.position = 17;
            this.title = e.readString(20);
            e.position++;
            f = e.readString(20);
            if (f == "FastTracker v2.00   " || f == "FastTracker v 2.00  ") {
              this.version = 1;
            } else if (f == "Sk@le Tracker") {
              y = 2;
              this.version = 2;
            } else if (f == "MadTracker 2.0") {
              this.version = 3;
            } else if (f == "MilkyTracker        ") {
              this.version = 4;
            } else if (f == "DigiBooster Pro 2.18") {
              this.version = 5;
            } else if (f.indexOf("OpenMPT") != -1) {
              this.version = 6;
            } else return;
            e.readUshort();
            n = e.readUint();
            this.length = e.readUshort();
            this.restart = e.readUshort();
            this.channels = e.readUshort();
            x = w = e.readUshort();
            this.instruments = [];
            this.instruments.length = e.readUshort() + 1;
            this.linear = e.readUshort();
            this.speed = e.readUshort();
            this.tempo = e.readUshort();
            this.track = new Uint8Array(this.length);
            for (a = 0; a < this.length; ++a) {
              p = e.readUbyte();
              if (p >= x) w = p + 1;
              this.track[a] = p;
            }
            this.patterns = [];
            this.patterns.length = w;
            if (w != x) {
              v = i(64, this.channels);
              p = v.size;
              for (a = 0; a < p; ++a) v.rows[a] = o();
              this.patterns[--w] = v;
            }
            e.position = m = n + 60;
            d = x;
            for (a = 0; a < d; ++a) {
              n = e.readUint();
              e.position++;
              v = i(e.readUshort(), this.channels);
              w = v.size;
              x = e.readUshort();
              e.position = m + n;
              h = e.position + x;
              if (x) {
                for (p = 0; p < w; ++p) {
                  b = o();
                  x = e.readUbyte();
                  if (x & 128) {
                    if (x & 1) b.note = e.readUbyte();
                    if (x & 2) b.instrument = e.readUbyte();
                    if (x & 4) b.volume = e.readUbyte();
                    if (x & 8) b.effect = e.readUbyte();
                    if (x & 16) b.param = e.readUbyte();
                  } else {
                    b.note = x;
                    b.instrument = e.readUbyte();
                    b.volume = e.readUbyte();
                    b.effect = e.readUbyte();
                    b.param = e.readUbyte();
                  }
                  if (b.note != S) if (b.note > 96) b.note = 0;
                  v.rows[p] = b;
                }
              } else {
                for (p = 0; p < w; ++p) v.rows[p] = o();
              }
              this.patterns[a] = v;
              m = e.position;
              if (m != h) m = e.position = h;
            }
            h = e.position;
            d = this.instruments.length;
            for (a = 1; a < d; ++a) {
              l = e.readUint();
              if (e.position + l >= e.length) break;
              c = r();
              c.name = e.readString(22);
              e.position++;
              x = e.readUshort();
              if (x > 16) x = 16;
              n = e.readUint();
              if (y == 2 && n != 64) n = 64;
              if (x) {
                c.samples = [];
                c.samples.length = x;
                for (p = 0; p < 96; ++p) c.noteSamples[p] = e.readUbyte();
                for (p = 0; p < 12; ++p)
                  c.volData.points[p] = s(e.readUshort(), e.readUshort());
                for (p = 0; p < 12; ++p)
                  c.panData.points[p] = s(e.readUshort(), e.readUshort());
                c.volData.total = e.readUbyte();
                c.panData.total = e.readUbyte();
                c.volData.sustain = e.readUbyte();
                c.volData.loopStart = e.readUbyte();
                c.volData.loopEnd = e.readUbyte();
                c.panData.sustain = e.readUbyte();
                c.panData.loopStart = e.readUbyte();
                c.panData.loopEnd = e.readUbyte();
                c.volData.flags = e.readUbyte();
                c.panData.flags = e.readUbyte();
                if (c.volData.flags & g) c.volEnabled = 1;
                if (c.panData.flags & g) c.panEnabled = 1;
                c.vibratoType = e.readUbyte();
                c.vibratoSweep = e.readUbyte();
                c.vibratoDepth = e.readUbyte();
                c.vibratoSpeed = e.readUbyte();
                c.fadeout = e.readUshort() << 1;
                e.position += y;
                m = e.position;
                this.instruments[a] = c;
                for (p = 0; p < x; ++p) {
                  E = u();
                  E.length = e.readUint();
                  E.loopStart = e.readUint();
                  E.loopLen = e.readUint();
                  E.volume = e.readUbyte();
                  E.finetune = e.readByte();
                  E.loopMode = e.readUbyte();
                  E.panning = e.readUbyte();
                  E.relative = e.readByte();
                  e.position++;
                  E.name = e.readString(22);
                  c.samples[p] = E;
                  e.position = m += n;
                }
                for (p = 0; p < x; ++p) {
                  E = c.samples[p];
                  if (!E.length) continue;
                  m = e.position + E.length;
                  if (E.loopMode & 16) {
                    E.bits = 16;
                    E.loopMode ^= 16;
                    E.length >>= 1;
                    E.loopStart >>= 1;
                    E.loopLen >>= 1;
                  }
                  if (!E.loopLen) E.loopMode = 0;
                  E.store(e);
                  if (E.loopMode) E.length = E.loopStart + E.loopLen;
                  e.position = m;
                }
              } else {
                e.position = h + l;
              }
              h = e.position;
              if (h >= e.length) break;
            }
            c = r();
            c.volData = t();
            c.panData = t();
            c.samples = [];
            for (a = 0; a < 12; ++a) {
              c.volData.points[a] = s();
              c.panData.points[a] = s();
            }
            E = u();
            E.length = 220;
            E.data = new Float32Array(220);
            for (a = 0; a < 220; ++a) E.data[a] = 0;
            c.samples[0] = E;
            this.instruments[0] = c;
          },
        },
        process: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s,
              o,
              u,
              a,
              p,
              v,
              g,
              y,
              x = this.voices[0];
            if (!this.tick) {
              if (this.nextOrder >= 0) this.order = this.nextOrder;
              if (this.nextPosition >= 0) this.position = this.nextPosition;
              this.nextOrder = this.nextPosition = -1;
              this.pattern = this.patterns[this.track[this.order]];
              while (x) {
                p = this.pattern.rows[this.position + x.index];
                e = p.volume >> 4;
                a = p.effect == 3 || p.effect == 5 || e == 15;
                o = p.param >> 4;
                x.keyoff = 0;
                if (x.arpDelta) {
                  x.arpDelta = 0;
                  x.flags |= f;
                }
                if (p.instrument) {
                  x.instrument =
                    p.instrument < this.instruments.length
                      ? this.instruments[p.instrument]
                      : null;
                  x.volEnvelope.reset();
                  x.panEnvelope.reset();
                  x.flags |= l | c | m;
                } else if (p.note == S || (p.effect == 20 && !p.param)) {
                  x.fadeEnabled = 1;
                  x.keyoff = 1;
                }
                if (p.note && p.note != S) {
                  if (x.instrument) {
                    n = x.instrument;
                    y = p.note - 1;
                    v = n.samples[n.noteSamples[y]];
                    y += v.relative;
                    if (y >= w && y <= E) {
                      if (!a) {
                        x.note = y;
                        x.sample = v;
                        if (p.instrument) {
                          x.volEnabled = n.volEnabled;
                          x.panEnabled = n.panEnabled;
                          x.flags |= d;
                        } else {
                          x.flags |= f | h;
                        }
                      }
                      if (p.instrument) {
                        x.reset();
                        x.fadeDelta = n.fadeout;
                      } else {
                        x.finetune = (v.finetune >> 3) << 2;
                      }
                      if (p.effect == 14 && o == 5)
                        x.finetune = ((p.param & 15) - 8) << 3;
                      if (this.linear) {
                        y = ((120 - y) << 6) - x.finetune;
                      } else {
                        y = this.amiga(y, x.finetune);
                      }
                      if (!a) {
                        x.period = y;
                        x.glissPeriod = 0;
                      } else {
                        x.portaPeriod = y;
                      }
                    }
                  } else {
                    x.volume = 0;
                    x.flags = l | m;
                  }
                } else if (x.vibratoReset) {
                  if (p.effect != 4 && p.effect != 6) {
                    x.vibDelta = 0;
                    x.vibratoReset = 0;
                    x.flags |= f;
                  }
                }
                if (p.volume) {
                  if (p.volume >= 16 && p.volume <= 80) {
                    x.volume = p.volume - 16;
                    x.flags |= l | m;
                  } else {
                    u = p.volume & 15;
                    switch (e) {
                      case 6:
                        x.volume -= u;
                        if (x.volume < 0) x.volume = 0;
                        x.flags |= l;
                        break;
                      case 7:
                        x.volume += u;
                        if (x.volume > 64) x.volume = 64;
                        x.flags |= l;
                        break;
                      case 10:
                        if (u) x.vibratoSpeed = u;
                        break;
                      case 11:
                        if (u) x.vibratoDepth = u << 2;
                        break;
                      case 12:
                        x.panning = u << 4;
                        x.flags |= c;
                        break;
                      case 15:
                        if (u) x.portaSpeed = u << 4;
                        break;
                    }
                  }
                }
                if (p.effect) {
                  u = p.param & 15;
                  switch (p.effect) {
                    case 1:
                      if (p.param) x.portaU = p.param << 2;
                      break;
                    case 2:
                      if (p.param) x.portaD = p.param << 2;
                      break;
                    case 3:
                      if (p.param && e != 15) x.portaSpeed = p.param;
                      break;
                    case 4:
                      x.vibratoReset = 1;
                      break;
                    case 5:
                      if (p.param) x.volSlide = p.param;
                      break;
                    case 6:
                      if (p.param) x.volSlide = p.param;
                      x.vibratoReset = 1;
                      break;
                    case 7:
                      if (o) x.tremoloSpeed = o;
                      if (u) x.tremoloDepth = u;
                      break;
                    case 8:
                      x.panning = p.param;
                      x.flags |= c;
                      break;
                    case 9:
                      if (p.param) x.sampleOffset = p.param << 8;
                      if (x.sampleOffset >= x.sample.length) {
                        x.volume = 0;
                        x.sampleOffset = 0;
                        x.flags &= ~(f | h);
                        x.flags |= l | m;
                      }
                      break;
                    case 10:
                      if (p.param) x.volSlide = p.param;
                      break;
                    case 11:
                      this.nextOrder = p.param;
                      if (this.nextOrder >= this.length) this.complete = 1;
                      else this.nextPosition = 0;
                      i = 1;
                      this.patternOffset = 0;
                      break;
                    case 12:
                      x.volume = p.param;
                      x.flags |= l | m;
                      break;
                    case 13:
                      this.nextPosition = (o * 10 + u) * this.channels;
                      this.patternOffset = 0;
                      if (!i) {
                        this.nextOrder = this.order + 1;
                        if (this.nextOrder >= this.length) {
                          this.complete = 1;
                          this.nextPosition = -1;
                        }
                      }
                      break;
                    case 14:
                      switch (o) {
                        case 1:
                          if (u) x.finePortaU = u << 2;
                          x.period -= x.finePortaU;
                          x.flags |= f;
                          break;
                        case 2:
                          if (u) x.finePortaD = u << 2;
                          x.period += x.finePortaD;
                          x.flags |= f;
                          break;
                        case 3:
                          x.glissando = u;
                          break;
                        case 4:
                          x.waveControl = (x.waveControl & 240) | u;
                          break;
                        case 6:
                          if (!u) {
                            x.patternLoopRow = this.patternOffset =
                              this.position;
                          } else {
                            if (!x.patternLoop) {
                              x.patternLoop = u;
                            } else {
                              x.patternLoop--;
                            }
                            if (x.patternLoop)
                              this.nextPosition = x.patternLoopRow;
                          }
                          break;
                        case 7:
                          x.waveControl = (x.waveControl & 15) | (u << 4);
                          break;
                        case 10:
                          if (u) x.fineSlideU = u;
                          x.volume += x.fineSlideU;
                          x.flags |= l;
                          break;
                        case 11:
                          if (u) x.fineSlideD = u;
                          x.volume -= x.fineSlideD;
                          x.flags |= l;
                          break;
                        case 13:
                          x.delay = x.flags;
                          x.flags = 0;
                          break;
                        case 14:
                          this.patternDelay = u * this.timer;
                          break;
                      }
                      break;
                    case 15:
                      if (!p.param) break;
                      if (p.param < 32) this.timer = p.param;
                      else
                        this.mixer.samplesTick =
                          ((this.sampleRate * 2.5) / p.param) >> 0;
                      break;
                    case 16:
                      this.master = p.param;
                      if (this.master > 64) this.master = 64;
                      x.flags |= l;
                      break;
                    case 17:
                      if (p.param) x.volSlideMaster = p.param;
                      break;
                    case 21:
                      if (!x.instrument || !x.instrument.volEnabled) break;
                      n = x.instrument;
                      y = p.param;
                      o = n.volData.total;
                      for (r = 0; r < o; r++)
                        if (y < n.volData.points[r].frame) break;
                      x.volEnvelope.position = --r;
                      o--;
                      if (n.volData.flags & b && r == n.volData.loopEnd) {
                        r = x.volEnvelope.position = n.volData.loopStart;
                        y = n.volData.points[r].frame;
                        x.volEnvelope.frame = y;
                      }
                      if (r >= o) {
                        x.volEnvelope.value = n.volData.points[o].value;
                        x.volEnvelope.stopped = 1;
                      } else {
                        x.volEnvelope.stopped = 0;
                        x.volEnvelope.frame = y;
                        if (y > n.volData.points[r].frame)
                          x.volEnvelope.position++;
                        t = n.volData.points[r];
                        s = n.volData.points[++r];
                        y = s.frame - t.frame;
                        x.volEnvelope.delta =
                          (y ? (((s.value - t.value) << 8) / y) >> 0 : 0) || 0;
                        x.volEnvelope.fraction = t.value << 8;
                      }
                      break;
                    case 24:
                      if (p.param) x.panSlide = p.param;
                      break;
                    case 27:
                      if (o) x.retrigx = o;
                      if (u) x.retrigy = u;
                      if (!p.volume && x.retrigy) {
                        e = this.tick + 1;
                        if (e % x.retrigy) break;
                        if (p.volume > 80 && x.retrigx) this.retrig(x);
                      }
                      break;
                    case 29:
                      if (p.param) {
                        x.tremorOn = ++o;
                        x.tremorOff = ++u + o;
                      }
                      break;
                    case 33:
                      if (o == 1) {
                        if (u) x.xtraPortaU = u;
                        x.period -= x.xtraPortaU;
                        x.flags |= f;
                      } else if (o == 2) {
                        if (u) x.xtraPortaD = u;
                        x.period += x.xtraPortaD;
                        x.flags |= f;
                      }
                      break;
                  }
                }
                x = x.next;
              }
            } else {
              while (x) {
                p = this.pattern.rows[this.position + x.index];
                if (x.delay) {
                  if ((p.param & 15) == this.tick) {
                    x.flags = x.delay;
                    x.delay = 0;
                  } else {
                    x = x.next;
                    continue;
                  }
                }
                if (p.volume) {
                  o = p.volume >> 4;
                  u = p.volume & 15;
                  switch (o) {
                    case 6:
                      x.volume -= u;
                      if (x.volume < 0) x.volume = 0;
                      x.flags |= l;
                      break;
                    case 7:
                      x.volume += u;
                      if (x.volume > 64) x.volume = 64;
                      x.flags |= l;
                      break;
                    case 11:
                      x.vibrato();
                      break;
                    case 13:
                      x.panning -= u;
                      if (x.panning < 0) x.panning = 0;
                      x.flags |= c;
                      break;
                    case 14:
                      x.panning += u;
                      if (x.panning > 255) x.panning = 255;
                      x.flags |= c;
                      break;
                    case 15:
                      if (x.portaPeriod) x.tonePortamento();
                      break;
                  }
                }
                o = p.param >> 4;
                u = p.param & 15;
                switch (p.effect) {
                  case 0:
                    if (!p.param) break;
                    y = (this.tick - this.timer) % 3;
                    if (y < 0) y += 3;
                    if (this.tick == 2 && this.timer == 18) y = 0;
                    if (!y) {
                      x.arpDelta = 0;
                    } else if (y == 1) {
                      if (this.linear) {
                        x.arpDelta = -(u << 6);
                      } else {
                        y = this.amiga(x.note + u, x.finetune);
                        x.arpDelta = y - x.period;
                      }
                    } else {
                      if (this.linear) {
                        x.arpDelta = -(o << 6);
                      } else {
                        y = this.amiga(x.note + o, x.finetune);
                        x.arpDelta = y - x.period;
                      }
                    }
                    x.flags |= f;
                    break;
                  case 1:
                    x.period -= x.portaU;
                    if (x.period < 0) x.period = 0;
                    x.flags |= f;
                    break;
                  case 2:
                    x.period += x.portaD;
                    if (x.period > 9212) x.period = 9212;
                    x.flags |= f;
                    break;
                  case 3:
                    if (x.portaPeriod) x.tonePortamento();
                    break;
                  case 4:
                    if (o) x.vibratoSpeed = o;
                    if (u) x.vibratoDepth = u << 2;
                    x.vibrato();
                    break;
                  case 5:
                    g = 1;
                    if (x.portaPeriod) x.tonePortamento();
                    break;
                  case 6:
                    g = 1;
                    x.vibrato();
                    break;
                  case 7:
                    x.tremolo();
                    break;
                  case 10:
                    g = 1;
                    break;
                  case 14:
                    switch (o) {
                      case 9:
                        if (this.tick % u == 0) {
                          x.volEnvelope.reset();
                          x.panEnvelope.reset();
                          x.flags |= l | c | h;
                        }
                        break;
                      case 12:
                        if (this.tick == u) {
                          x.volume = 0;
                          x.flags |= l;
                        }
                        break;
                    }
                    break;
                  case 17:
                    o = x.volSlideMaster >> 4;
                    u = x.volSlideMaster & 15;
                    if (o) {
                      this.master += o;
                      if (this.master > 64) this.master = 64;
                      x.flags |= l;
                    } else if (u) {
                      this.master -= u;
                      if (this.master < 0) this.master = 0;
                      x.flags |= l;
                    }
                    break;
                  case 20:
                    if (this.tick == p.param) {
                      x.fadeEnabled = 1;
                      x.keyoff = 1;
                    }
                    break;
                  case 24:
                    o = x.panSlide >> 4;
                    u = x.panSlide & 15;
                    if (o) {
                      x.panning += o;
                      if (x.panning > 255) x.panning = 255;
                      x.flags |= c;
                    } else if (u) {
                      x.panning -= u;
                      if (x.panning < 0) x.panning = 0;
                      x.flags |= c;
                    }
                    break;
                  case 27:
                    e = this.tick;
                    if (!p.volume) e++;
                    if (e % x.retrigy) break;
                    if ((!p.volume || p.volume > 80) && x.retrigx)
                      this.retrig(x);
                    x.flags |= h;
                    break;
                  case 29:
                    x.tremor();
                    break;
                }
                if (g) {
                  o = x.volSlide >> 4;
                  u = x.volSlide & 15;
                  g = 0;
                  if (o) {
                    x.volume += o;
                    x.flags |= l;
                  } else if (u) {
                    x.volume -= u;
                    x.flags |= l;
                  }
                }
                x = x.next;
              }
            }
            if (++this.tick >= this.timer + this.patternDelay) {
              this.patternDelay = this.tick = 0;
              if (this.nextPosition < 0) {
                this.nextPosition = this.position + this.channels;
                if (this.nextPosition >= this.pattern.size || this.complete) {
                  this.nextOrder = this.order + 1;
                  this.nextPosition = this.patternOffset;
                  if (this.nextOrder >= this.length) {
                    this.nextOrder = this.restart;
                    this.mixer.complete = 1;
                  }
                }
              }
            }
          },
        },
        fast: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s = this.voices[0],
              o;
            while (s) {
              e = s.channel;
              n = s.flags;
              s.flags = 0;
              if (n & h) {
                e.index = s.sampleOffset;
                e.pointer = -1;
                e.dir = 0;
                e.fraction = 0;
                e.sample = s.sample;
                e.length = s.sample.length;
                e.enabled = e.sample.data ? 1 : 0;
                s.playing = s.instrument;
                s.sampleOffset = 0;
              }
              r = s.playing;
              t = r.vibratoSpeed ? s.autoVibrato() : 0;
              o = s.volume + s.volDelta;
              if (r.volEnabled) {
                if (s.volEnabled && !s.volEnvelope.stopped)
                  this.envelope(s, s.volEnvelope, r.volData);
                o = (o * s.volEnvelope.value) >> 6;
                n |= l;
                if (s.fadeEnabled) {
                  s.fadeVolume -= s.fadeDelta;
                  if (s.fadeVolume < 0) {
                    o = 0;
                    s.fadeVolume = 0;
                    s.fadeEnabled = 0;
                    s.volEnvelope.value = 0;
                    s.volEnvelope.stopped = 1;
                    s.panEnvelope.stopped = 1;
                  } else {
                    o = (o * s.fadeVolume) >> 16;
                  }
                }
              } else if (s.keyoff) {
                o = 0;
                n |= l;
              }
              i = s.panning;
              if (r.panEnabled) {
                if (s.panEnabled && !s.panEnvelope.stopped)
                  this.envelope(s, s.panEnvelope, r.panData);
                i = s.panEnvelope.value << 2;
                n |= c;
                if (i < 0) i = 0;
                else if (i > 255) i = 255;
              }
              if (n & l) {
                if (o < 0) o = 0;
                else if (o > 64) o = 64;
                e.volume = C[(o * this.master) >> 6];
                e.lvol = e.volume * e.lpan;
                e.rvol = e.volume * e.rpan;
              }
              if (n & c) {
                e.panning = i;
                e.lpan = N[256 - i];
                e.rpan = N[i];
                e.lvol = e.volume * e.lpan;
                e.rvol = e.volume * e.rpan;
              }
              if (n & f) {
                t += s.period + s.arpDelta + s.vibDelta;
                if (this.linear) {
                  e.speed =
                    (((548077568 * Math.pow(2, (4608 - t) / 768)) /
                      this.sampleRate) >>
                      0) /
                    65536;
                } else {
                  e.speed =
                    (((65536 * (14317456 / t)) / this.sampleRate) >> 0) / 65536;
                }
                e.delta = e.speed >> 0;
                e.speed -= e.delta;
              }
              s = s.next;
            }
          },
        },
        accurate: {
          value: function () {
            var e,
              t,
              n,
              r,
              i,
              s,
              o,
              u,
              a,
              p = this.voices[0],
              d;
            while (p) {
              e = p.channel;
              n = p.flags;
              p.flags = 0;
              if (n & h) {
                if (e.sample) {
                  n |= m;
                  e.mixCounter = 220;
                  e.oldSample = null;
                  e.oldPointer = -1;
                  if (e.enabled) {
                    e.oldDir = e.dir;
                    e.oldFraction = e.fraction;
                    e.oldSpeed = e.speed;
                    e.oldSample = e.sample;
                    e.oldPointer = e.pointer;
                    e.oldLength = e.length;
                    e.lmixRampD = e.lvol;
                    e.lmixDeltaD = e.lvol / 220;
                    e.rmixRampD = e.rvol;
                    e.rmixDeltaD = e.rvol / 220;
                  }
                }
                e.dir = 1;
                e.fraction = 0;
                e.sample = p.sample;
                e.pointer = p.sampleOffset;
                e.length = p.sample.length;
                e.enabled = e.sample.data ? 1 : 0;
                p.playing = p.instrument;
                p.sampleOffset = 0;
              }
              r = p.playing;
              t = r.vibratoSpeed ? p.autoVibrato() : 0;
              d = p.volume + p.volDelta;
              if (r.volEnabled) {
                if (p.volEnabled && !p.volEnvelope.stopped)
                  this.envelope(p, p.volEnvelope, r.volData);
                d = (d * p.volEnvelope.value) >> 6;
                n |= l;
                if (p.fadeEnabled) {
                  p.fadeVolume -= p.fadeDelta;
                  if (p.fadeVolume < 0) {
                    d = 0;
                    p.fadeVolume = 0;
                    p.fadeEnabled = 0;
                    p.volEnvelope.value = 0;
                    p.volEnvelope.stopped = 1;
                    p.panEnvelope.stopped = 1;
                  } else {
                    d = (d * p.fadeVolume) >> 16;
                  }
                }
              } else if (p.keyoff) {
                d = 0;
                n |= l;
              }
              o = p.panning;
              if (r.panEnabled) {
                if (p.panEnabled && !p.panEnvelope.stopped)
                  this.envelope(p, p.panEnvelope, r.panData);
                o = p.panEnvelope.value << 2;
                n |= c;
                if (o < 0) o = 0;
                else if (o > 255) o = 255;
              }
              if (!e.enabled) {
                e.volCounter = 0;
                e.panCounter = 0;
                p = p.next;
                continue;
              }
              if (n & l) {
                if (d < 0) d = 0;
                else if (d > 64) d = 64;
                d = C[(d * this.master) >> 6];
                s = d * N[256 - o];
                a = d * N[o];
                if (d != e.volume && !e.mixCounter) {
                  e.volCounter = n & m ? 220 : this.mixer.samplesTick;
                  e.lvolDelta = (s - e.lvol) / e.volCounter;
                  e.rvolDelta = (a - e.rvol) / e.volCounter;
                } else {
                  e.lvol = s;
                  e.rvol = a;
                }
                e.volume = d;
              }
              if (n & c) {
                i = N[256 - o];
                u = N[o];
                if (o != e.panning && !e.mixCounter && !e.volCounter) {
                  e.panCounter = this.mixer.samplesTick;
                  e.lpanDelta = (i - e.lpan) / e.panCounter;
                  e.rpanDelta = (u - e.rpan) / e.panCounter;
                } else {
                  e.lpan = i;
                  e.rpan = u;
                }
                e.panning = o;
              }
              if (n & f) {
                t += p.period + p.arpDelta + p.vibDelta;
                if (this.linear) {
                  e.speed =
                    (((548077568 * Math.pow(2, (4608 - t) / 768)) /
                      this.sampleRate) >>
                      0) /
                    65536;
                } else {
                  e.speed =
                    (((65536 * (14317456 / t)) / this.sampleRate) >> 0) / 65536;
                }
              }
              if (e.mixCounter) {
                e.lmixRampU = 0;
                e.lmixDeltaU = e.lvol / 220;
                e.rmixRampU = 0;
                e.rmixDeltaU = e.rvol / 220;
              }
              p = p.next;
            }
          },
        },
        envelope: {
          value: function (e, t, n) {
            var r = t.position,
              i = n.points[r],
              s;
            if (t.frame == i.frame) {
              if (n.flags & b && r == n.loopEnd) {
                r = t.position = n.loopStart;
                i = n.points[r];
                t.frame = i.frame;
              }
              if (r == n.total - 1) {
                t.value = i.value;
                t.stopped = 1;
                return;
              }
              if (n.flags & y && r == n.sustain && !e.fadeEnabled) {
                t.value = i.value;
                return;
              }
              t.position++;
              s = n.points[t.position];
              t.delta =
                (((s.value - i.value) << 8) / (s.frame - i.frame)) >> 0 || 0;
              t.fraction = i.value << 8;
            } else {
              t.fraction += t.delta;
            }
            t.value = t.fraction >> 8;
            t.frame++;
          },
        },
        amiga: {
          value: function (e, t) {
            var n = 0,
              r = k[++e];
            if (t < 0) {
              n = (k[--e] - r) / 64;
            } else if (t > 0) {
              n = (r - k[++e]) / 64;
            }
            return (r - n * t) >> 0;
          },
        },
        retrig: {
          value: function (e) {
            switch (e.retrigx) {
              case 1:
                e.volume--;
                break;
              case 2:
                e.volume++;
                break;
              case 3:
                e.volume -= 4;
                break;
              case 4:
                e.volume -= 8;
                break;
              case 5:
                e.volume -= 16;
                break;
              case 6:
                e.volume = (e.volume << 1) / 3;
                break;
              case 7:
                e.volume >>= 1;
                break;
              case 8:
                e.volume = e.sample.volume;
                break;
              case 9:
                e.volume++;
                break;
              case 10:
                e.volume += 2;
                break;
              case 11:
                e.volume += 4;
                break;
              case 12:
                e.volume += 8;
                break;
              case 13:
                e.volume += 16;
                break;
              case 14:
                e.volume = (e.volume * 3) >> 1;
                break;
              case 15:
                e.volume <<= 1;
                break;
            }
            if (e.volume < 0) e.volume = 0;
            else if (e.volume > 64) e.volume = 64;
            e.flags |= l;
          },
        },
      });
      return Object.seal(a);
    }
    var f = 1,
      l = 2,
      c = 4,
      h = 8,
      d = 15,
      m = 32,
      g = 1,
      y = 2,
      b = 4,
      w = 0,
      E = 118,
      S = 97,
      x = [
        0, -2, -3, -5, -6, -8, -9, -11, -12, -14, -16, -17, -19, -20, -22, -23,
        -24, -26, -27, -29, -30, -32, -33, -34, -36, -37, -38, -39, -41, -42,
        -43, -44, -45, -46, -47, -48, -49, -50, -51, -52, -53, -54, -55, -56,
        -56, -57, -58, -59, -59, -60, -60, -61, -61, -62, -62, -62, -63, -63,
        -63, -64, -64, -64, -64, -64, -64, -64, -64, -64, -64, -64, -63, -63,
        -63, -62, -62, -62, -61, -61, -60, -60, -59, -59, -58, -57, -56, -56,
        -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42,
        -41, -39, -38, -37, -36, -34, -33, -32, -30, -29, -27, -26, -24, -23,
        -22, -20, -19, -17, -16, -14, -12, -11, -9, -8, -6, -5, -3, -2, 0, 2, 3,
        5, 6, 8, 9, 11, 12, 14, 16, 17, 19, 20, 22, 23, 24, 26, 27, 29, 30, 32,
        33, 34, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
        53, 54, 55, 56, 56, 57, 58, 59, 59, 60, 60, 61, 61, 62, 62, 62, 63, 63,
        63, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 63, 63, 63, 62, 62, 62,
        61, 61, 60, 60, 59, 59, 58, 57, 56, 56, 55, 54, 53, 52, 51, 50, 49, 48,
        47, 46, 45, 44, 43, 42, 41, 39, 38, 37, 36, 34, 33, 32, 30, 29, 27, 26,
        24, 23, 22, 20, 19, 17, 16, 14, 12, 11, 9, 8, 6, 5, 3, 2,
      ],
      T = [
        0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250,
        253, 255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74,
        49, 24,
      ],
      N = [
        0, 0.04417, 0.062489, 0.076523, 0.088371, 0.098821, 0.108239, 0.116927,
        0.124977, 0.132572, 0.139741, 0.146576, 0.153077, 0.159335, 0.16535,
        0.171152, 0.176772, 0.18221, 0.187496, 0.19263, 0.197643, 0.202503,
        0.207273, 0.211951, 0.216477, 0.220943, 0.225348, 0.229631, 0.233854,
        0.237985, 0.242056, 0.246066, 0.249985, 0.253873, 0.25767, 0.261437,
        0.265144, 0.268819, 0.272404, 0.275989, 0.279482, 0.282976, 0.286409,
        0.289781, 0.293153, 0.296464, 0.299714, 0.302965, 0.306185, 0.309344,
        0.312473, 0.315602, 0.318671, 0.321708, 0.324746, 0.327754, 0.3307,
        0.333647, 0.336563, 0.339449, 0.342305, 0.345161, 0.347986, 0.350781,
        0.353545, 0.356279, 0.359013, 0.361717, 0.364421, 0.367094, 0.369737,
        0.37238, 0.374992, 0.377574, 0.380157, 0.382708, 0.38526, 0.387782,
        0.390303, 0.392794, 0.395285, 0.397746, 0.400176, 0.402606, 0.405037,
        0.407437, 0.409836, 0.412206, 0.414576, 0.416915, 0.419254, 0.421563,
        0.423841, 0.42618, 0.428458, 0.430737, 0.432985, 0.435263, 0.437481,
        0.439729, 0.441916, 0.444134, 0.446321, 0.448508, 0.450665, 0.452852,
        0.455009, 0.457136, 0.459262, 0.461389, 0.463485, 0.465611, 0.467708,
        0.469773, 0.471839, 0.473935, 0.47597, 0.478036, 0.480072, 0.482077,
        0.484112, 0.486117, 0.488122, 0.490127, 0.492101, 0.494106, 0.496051,
        0.498025, 0.5, 0.501944, 0.503888, 0.505802, 0.507746, 0.50966,
        0.511574, 0.513488, 0.515371, 0.517255, 0.519138, 0.521022, 0.522905,
        0.524758, 0.526611, 0.528465, 0.530318, 0.53214, 0.533993, 0.535816,
        0.537639, 0.539462, 0.541254, 0.543046, 0.544839, 0.546631, 0.548423,
        0.550216, 0.551978, 0.553739, 0.555501, 0.557263, 0.558995, 0.560757,
        0.562489, 0.56422, 0.565952, 0.567683, 0.569384, 0.571116, 0.572817,
        0.574518, 0.57622, 0.57789, 0.579592, 0.581262, 0.582964, 0.584634,
        0.586305, 0.587946, 0.589617, 0.591257, 0.592928, 0.594568, 0.596209,
        0.597849, 0.599459, 0.6011, 0.60271, 0.60435, 0.60596, 0.60757, 0.60915,
        0.61076, 0.61237, 0.61395, 0.61556, 0.617139, 0.618719, 0.620268,
        0.621848, 0.623428, 0.624977, 0.626557, 0.628106, 0.629655, 0.631205,
        0.632754, 0.634303, 0.635822, 0.637372, 0.63889, 0.64044, 0.641959,
        0.643478, 0.644966, 0.646485, 0.648004, 0.649523, 0.651012, 0.6525,
        0.653989, 0.655477, 0.656966, 0.658454, 0.659943, 0.661431, 0.66289,
        0.664378, 0.665836, 0.667294, 0.668783, 0.670241, 0.671699, 0.673127,
        0.674585, 0.676043, 0.677471, 0.678929, 0.680357, 0.681785, 0.683213,
        0.684641, 0.686068, 0.687496, 0.688894, 0.690321, 0.691749, 0.693147,
        0.694574, 0.695972, 0.697369, 0.698767, 0.700164, 0.701561, 0.702928,
        0.704326, 0.705723, 0.70711,
      ],
      C = [
        0, 0.005863, 0.013701, 0.021569, 0.029406, 0.037244, 0.045082, 0.052919,
        0.060757, 0.068625, 0.076463, 0.0843, 0.092138, 0.099976, 0.107844,
        0.115681, 0.123519, 0.131357, 0.139194, 0.147032, 0.1549, 0.162738,
        0.170575, 0.178413, 0.186251, 0.194119, 0.201956, 0.209794, 0.217632,
        0.225469, 0.233307, 0.241175, 0.249013, 0.25685, 0.264688, 0.272526,
        0.280394, 0.288231, 0.296069, 0.303907, 0.311744, 0.319582, 0.32745,
        0.335288, 0.343125, 0.350963, 0.3588, 0.366669, 0.374506, 0.382344,
        0.390182, 0.398019, 0.405857, 0.413725, 0.421563, 0.4294, 0.437238,
        0.445076, 0.452944, 0.460781, 0.468619, 0.476457, 0.484294, 0.492132,
        0.5,
      ],
      k = [
        29024, 27392, 25856, 24384, 23040, 21696, 20480, 19328, 18240, 17216,
        16256, 15360, 14512, 13696, 12928, 12192, 11520, 10848, 10240, 9664,
        9120, 8608, 8128, 7680, 7256, 6848, 6464, 6096, 5760, 5424, 5120, 4832,
        4560, 4304, 4064, 3840, 3628, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
        2280, 2152, 2032, 1920, 1814, 1712, 1616, 1524, 1440, 1356, 1280, 1208,
        1140, 1076, 1016, 960, 907, 856, 808, 762, 720, 678, 640, 604, 570, 538,
        508, 480, 453, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240,
        227, 214, 202, 190, 180, 169, 160, 151, 142, 134, 127, 120, 113, 107,
        101, 95, 90, 85, 80, 75, 71, 67, 63, 60, 57, 53, 50, 48, 45, 42, 40, 38,
        36, 34, 32, 30, 28,
      ];
    window.neoart.F2Player = a;
  })();
})();
