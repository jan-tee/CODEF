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

import { canvas } from "../core/canvas";

export class FX {
  constructor(
    public src: canvas,
    public dst: canvas,
    public params: {
      value: any;
      amp: number;
      inc: number;
      offset: number;
    }[]
  ) {}

  siny(posx: number, posy: number) {
    var oldvalue = new Array();
    var tmp = this.dst.contex.globalAlpha;
    this.dst.contex.globalAlpha = 1;
    for (var j = 0; j < this.params.length; j++) {
      oldvalue[j] = this.params[j].value;
    }
    for (var i = 0; i < this.src.canvas.width; i++) {
      var prov = 0;
      for (var j = 0; j < this.params.length; j++) {
        prov += Math.sin(this.params[j].value) * this.params[j].amp;
      }

      this.src.drawPart(
        this.dst,
        i + posx,
        prov + posy,
        i,
        0,
        1,
        this.src.canvas.height
      );

      for (var j = 0; j < this.params.length; j++) {
        this.params[j].value += this.params[j].inc;
      }
    }
    for (var j = 0; j < this.params.length; j++) {
      this.params[j].value = oldvalue[j] + this.params[j].offset;
    }
    this.dst.contex.globalAlpha = tmp;
  }

  // @TODO had max:number as last param, but was unused
  zoomy(posx: number, posy: number) {
    var oldvalue = new Array();
    var tmp = this.dst.contex.globalAlpha;
    this.dst.contex.globalAlpha = 1;
    for (var j = 0; j < this.params.length; j++) {
      oldvalue[j] = this.params[j].value;
    }
    for (var i = 0; i < this.src.canvas.width; i++) {
      var prov = 0;
      for (var j = 0; j < this.params.length; j++) {
        prov += Math.sin(this.params[j].value) * this.params[j].amp;
      }

      this.src.drawPart(
        this.dst,
        i + posx,
        posy,
        i,
        0,
        1,
        this.src.canvas.height,
        1,
        0,
        1,
        prov
      );

      for (var j = 0; j < this.params.length; j++) {
        this.params[j].value += this.params[j].inc;
      }
    }
    for (var j = 0; j < this.params.length; j++) {
      this.params[j].value = oldvalue[j] + this.params[j].offset;
    }
    this.dst.contex.globalAlpha = tmp;
  }

  sinx(posx: number, posy: number) {
    var tmp = this.dst.contex.globalAlpha;
    this.dst.contex.globalAlpha = 1;
    var oldvalue = new Array();
    for (var j = 0; j < this.params.length; j++) {
      oldvalue[j] = this.params[j].value;
    }
    for (var i = 0; i < this.src.canvas.height; i++) {
      var prov = 0;
      for (var j = 0; j < this.params.length; j++) {
        prov += Math.sin(this.params[j].value) * this.params[j].amp;
      }

      this.src.drawPart(
        this.dst,
        prov + posx,
        i + posy,
        0,
        i,
        this.src.canvas.width,
        1
      );

      for (var j = 0; j < this.params.length; j++) {
        this.params[j].value += this.params[j].inc;
      }
    }
    for (var j = 0; j < this.params.length; j++) {
      this.params[j].value = oldvalue[j] + this.params[j].offset;
    }
    this.dst.contex.globalAlpha = tmp;
  }

  zoomx(posx: number, posy: number, max: number) {
    var tmp = this.dst.contex.globalAlpha;
    this.dst.contex.globalAlpha = 1;
    var oldvalue = new Array();
    for (var j = 0; j < this.params.length; j++) {
      oldvalue[j] = this.params[j].value;
    }
    for (var i = 0; i < this.src.canvas.height; i++) {
      var prov = 0;
      for (var j = 0; j < this.params.length; j++) {
        prov +=
          max +
          this.params[j].amp +
          Math.sin(this.params[j].value) * this.params[j].amp;
      }

      this.src.drawPart(
        this.dst,
        posx,
        i + posy,
        0,
        i,
        this.src.canvas.width,
        1,
        1,
        0,
        prov,
        1
      );

      for (var j = 0; j < this.params.length; j++) {
        this.params[j].value += this.params[j].inc;
      }
    }
    for (var j = 0; j < this.params.length; j++) {
      this.params[j].value = oldvalue[j] + this.params[j].offset;
    }
    this.dst.contex.globalAlpha = tmp;
  }
}
