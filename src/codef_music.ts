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

import { log_music } from "./debug";
import { dataType } from "./ym/datatype";
import { YmConst_PLAYER_FREQ } from "./ym/ym_const";
import { YmProcessor } from "./ym/ym_processor";

export class music {
  public static CODEF_AUDIO_CONTEXT?: AudioContext;
  public static CODEF_AUDIO_NODE?: ScriptProcessorNode;
  public static YmConst_PLAYER_FREQ: number = YmConst_PLAYER_FREQ;
  loader?: {
    // @TODO this is an imperfect abstractio
    player?: {
      stereo: boolean;
      load: (o: dataType) => void;
      reset?: () => void;
      play?: () => void;
    };
    load?: (o: ArrayBuffer) => void;
  };
  stereo_value?: boolean;
  stereo?: (e: boolean) => void;

  LoadAndRun?: (url: string) => void;

  constructor(type: "YM" | string) {
    // @TODO review if still relevant
    window.AudioContext =
      window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext ||
      window.oAudioContext ||
      window.msAudioContext;
    if (window.AudioContext != undefined) {
      log_music("Entry point for module: %s", type);
      switch (type) {
        case "YM":
          music.CODEF_AUDIO_CONTEXT = new AudioContext(); // Atari YM Format !!! ;) /////webkitAudioContext();
          music.CODEF_AUDIO_NODE =
            music.CODEF_AUDIO_CONTEXT.createScriptProcessor(8192);
          this.loader = {
            player: new YmProcessor(),
          };
          this.stereo_value = false;

          this.LoadAndRun = function (zic) {
            var __self = this;
            if (typeof AudioContext != "undefined") {
              var fetch = new XMLHttpRequest();
              fetch.open("GET", zic);
              fetch.overrideMimeType("text/plain; charset=x-user-defined");
              fetch.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                  var t = this.responseText || "";
                  var ff = [];
                  var mx = t.length;
                  var scc = String.fromCharCode;
                  for (var z = 0; z < mx; z++) {
                    ff[z] = scc(t.charCodeAt(z) & 255);
                  }
                  var binString = new dataType();
                  binString.data = ff.join("");
                  // @TODO there was no prefix, it wrote to the global constant
                  music.YmConst_PLAYER_FREQ =
                    music.CODEF_AUDIO_CONTEXT!.sampleRate;
                  __self.loader!.player!.stereo = __self.stereo_value === true;
                  __self.loader!.player!.load(binString);
                }
              };
              fetch.send();
            }
          };
          break;
        default:
          this.stereo_value = false;
          this.LoadAndRun = function (zic) {
            var __self = this;
            this.loader = window.neoart.FileLoader;
            var fetch = new XMLHttpRequest();
            fetch.open("GET", zic);
            fetch.overrideMimeType("text/plain; charset=x-user-defined");
            fetch.responseType = "arraybuffer";
            fetch.onreadystatechange = function () {
              if (this.readyState == 4 && this.status == 200) {
                // @TODO likely the neoart player will set the player propertiy on load, but unclear
                // __self.loader!.player! = null;
                __self.loader!.load!(this.response);
                __self.loader!.player!.reset!();

                __self.loader!.player!.stereo = __self.stereo_value === true;
                __self.loader!.player!.play!();
              }
            };
            fetch.send();
          };
          break;
      }

      this.stereo = function (stat) {
        this.stereo_value = stat;
      };
    }
  }
}
