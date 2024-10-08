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
import { image } from "../core/image";

export class ltrobj {
  constructor(public posx: number, public posy: number, public ltr: number) {}
}

function sortPosx(a: ltrobj, b: ltrobj) {
  var x = a.posx;
  var y = b.posx;
  return x < y ? -1 : x > y ? 1 : 0;
}

function sortPosy(a: ltrobj, b: ltrobj) {
  var x = a.posy;
  var y = b.posy;
  return x < y ? -1 : x > y ? 1 : 0;
}

type SinParam = {
  myvalue: number;
  amp: number;
  inc: number;
  offset: number;
};

export class scrolltext_horizontal {
  public scroffset = 0;
  public oldspeed = 0;
  public speed = 1;
  public font?: image;
  public letters: ltrobj[] = [];
  public scrtxt = " ";
  public pausetimer = 0;
  public pausedelay = 0;

  public fontw?: number;
  public fonth?: number;
  public fontstart?: number;
  public wide?: number;
  public dst?: canvas;

  public sinparam?: SinParam[];
  public type: number = 0;

  constructor() {}

  public init(
    dst: canvas,
    font: image,
    speed: number,
    sinparam?: SinParam[],
    type?: number
  ) {
    this.speed = speed;
    this.dst = dst;
    this.font = font;
    this.fontw = this.font.tilew;
    this.fonth = this.font.tileh;
    this.fontstart = this.font.tilestart;
    this.wide = Math.ceil(this.dst.canvas.width / this.fontw) + 1;
    for (let i = 0; i <= this.wide; i++) {
      this.letters[i] = new ltrobj(
        Math.ceil(this.wide * this.fontw + i * this.fontw),
        0,
        this.scrtxt.charCodeAt(this.scroffset)
      );
      this.scroffset++;
    }
    if (sinparam !== undefined) {
      this.sinparam = sinparam;
    }
    if (type !== undefined) {
      this.type = type;
    }
  }

  public draw(posy: number) {
    let prov = 0;
    let temp = new Array();
    let tmp = this.dst!.contex.globalAlpha;
    this.dst!.contex.globalAlpha = 1;
    var oldvalue = new Array();
    var i;
    if (typeof this.sinparam != "undefined") {
      for (let j = 0; j < this.sinparam.length; j++) {
        oldvalue[j] = this.sinparam[j].myvalue;
      }
    }
    if (this.speed == 0) {
      this.pausetimer += 1;
      if (this.pausetimer == 60 * this.pausedelay) {
        this.speed = this.oldspeed;
      }
    }
    var speed = this.speed;
    for (i = 0; i <= this.wide!; i++) {
      this.letters[i].posx -= speed;
      if (this.letters[i].posx <= -this.fontw!) {
        if (this.scrtxt.charAt(this.scroffset) == "^") {
          if (this.scrtxt.charAt(this.scroffset + 1) == "P") {
            this.pausedelay = parseInt(this.scrtxt.charAt(this.scroffset + 2));
            this.pausetimer = 0;
            this.oldspeed = this.speed;
            this.speed = 0;
            this.scroffset += 3;
          } else if (this.scrtxt.charAt(this.scroffset + 1) == "S") {
            this.speed = parseInt(this.scrtxt.charAt(this.scroffset + 2));
            this.scroffset += 3;
          }
          //
          // ADDON by Robert Annett
          //
          else if (this.scrtxt.charAt(this.scroffset + 1) == "C") {
            var end = this.scrtxt.indexOf(";", this.scroffset + 2);
            var functionName = this.scrtxt.substring(this.scroffset + 2, end);
            // @TODO
            (<any>window)[functionName]();
            this.scroffset += end - this.scroffset + 1;
          }
        } else {
          this.letters[i].posx =
            this.wide! * this.fontw! + (this.letters[i].posx + this.fontw!);
          if (typeof this.sinparam != "undefined") {
            for (var j = 0; j < this.sinparam.length; j++) {
              oldvalue[j] += this.sinparam[j].inc;
            }
          }
          this.letters[i].ltr = this.scrtxt.charCodeAt(this.scroffset);
          this.scroffset++;
          if (this.scroffset > this.scrtxt.length - 1) this.scroffset = 0;
        }
      }
    }
    if (typeof this.sinparam != "undefined") {
      for (var j = 0; j < this.sinparam.length; j++) {
        this.sinparam[j].myvalue = oldvalue[j];
      }
    }

    for (j = 0; j <= this.wide!; j++) {
      temp[j] = { indice: j, posx: this.letters[j].posx };
    }
    temp.sort(sortPosx);
    for (i = 0; i <= this.wide!; i++) {
      if (this.sinparam) {
        prov = 0;
        for (var j = 0; j < this.sinparam.length; j++) {
          if (this.type == 0)
            prov += Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp;
          if (this.type == 1)
            prov += -Math.abs(
              Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp
            );
          if (this.type == 2)
            prov += Math.abs(
              Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp
            );
        }
      }
      this.font!.drawTile(
        this.dst!,
        this.letters[temp[i].indice].ltr - this.fontstart!,
        this.letters[temp[i].indice].posx,
        prov + posy
      );

      if (typeof this.sinparam != "undefined") {
        for (var j = 0; j < this.sinparam.length; j++) {
          this.sinparam[j].myvalue += this.sinparam[j].inc;
        }
      }
    }
    if (typeof this.sinparam != "undefined") {
      for (var j = 0; j < this.sinparam.length; j++) {
        this.sinparam[j].myvalue = oldvalue[j] + this.sinparam[j].offset;
      }
    }
    this.dst!.contex.globalAlpha = tmp;
  }
}

export class scrolltext_vertical {
  public scroffset = 0;
  public oldspeed = 0;
  public speed = 1;
  public font?: image;
  public letters: ltrobj[] = [];
  public scrtxt = " ";
  public pausetimer = 0;
  public pausedelay = 0;
  public dst?: canvas;

  public fontw?: number;
  public fonth?: number;
  public fontstart?: number;
  public wide?: number;
  public sinparam?: SinParam[];
  public type: number = 0;

  init(
    dst: canvas,
    font: image,
    speed: number,
    sinparam: SinParam[],
    type?: number
  ) {
    this.speed = speed;
    this.dst = dst;
    this.font = font;
    this.fontw = this.font.tilew;
    this.fonth = this.font.tileh;
    this.fontstart = this.font.tilestart;
    this.wide = Math.ceil(this.dst.canvas.height / this.fonth) + 1;
    for (let i = 0; i <= this.wide; i++) {
      this.letters[i] = new ltrobj(
        0,
        Math.ceil(this.wide * this.fonth + i * this.fonth),
        this.scrtxt.charCodeAt(this.scroffset)
      );
      this.scroffset++;
    }
    if (sinparam != undefined) {
      this.sinparam = sinparam;
    }
    if (type != undefined) {
      this.type = type;
    }
  }

  public draw(posx: number) {
    var prov = 0;
    var temp = new Array();
    var tmp = this.dst!.contex.globalAlpha;
    this.dst!.contex.globalAlpha = 1;
    var oldvalue = new Array();
    var i;
    if (typeof this.sinparam != "undefined") {
      for (var j = 0; j < this.sinparam.length; j++) {
        oldvalue[j] = this.sinparam[j].myvalue;
      }
    }
    if (this.speed == 0) {
      this.pausetimer += 1;
      if (this.pausetimer == 60 * this.pausedelay) {
        this.speed = this.oldspeed;
      }
    }
    var speed = this.speed;
    for (i = 0; i <= this.wide!; i++) {
      this.letters[i].posy -= speed;
      if (this.letters[i].posy <= -this.fonth!) {
        if (this.scrtxt.charAt(this.scroffset) == "^") {
          if (this.scrtxt.charAt(this.scroffset + 1) == "P") {
            this.pausedelay = parseInt(this.scrtxt.charAt(this.scroffset + 2));
            this.pausetimer = 0;
            this.oldspeed = this.speed;
            this.speed = 0;
            this.scroffset += 3;
          } else if (this.scrtxt.charAt(this.scroffset + 1) == "S") {
            this.speed = parseInt(this.scrtxt.charAt(this.scroffset + 2));
            this.scroffset += 3;
          }
          //
          // ADDON by Robert Annett
          //
          else if (this.scrtxt.charAt(this.scroffset + 1) == "C") {
            var end = this.scrtxt.indexOf(";", this.scroffset + 2);
            var functionName = this.scrtxt.substring(this.scroffset + 2, end);
            // @TODO
            (<any>window)[functionName]();
            this.scroffset += end - this.scroffset + 1;
          }
        } else {
          this.letters[i].posy =
            this.wide! * this.fonth! + (this.letters[i].posy + this.fonth!);
          if (this.sinparam) {
            for (var j = 0; j < this.sinparam.length; j++) {
              oldvalue[j] += this.sinparam[j].inc;
            }
          }
          this.letters[i].ltr = this.scrtxt.charCodeAt(this.scroffset);
          this.scroffset++;
          if (this.scroffset > this.scrtxt.length - 1) this.scroffset = 0;
        }
      }
    }
    if (typeof this.sinparam != "undefined") {
      for (var j = 0; j < this.sinparam.length; j++) {
        this.sinparam[j].myvalue = oldvalue[j];
      }
    }

    for (let j = 0; j <= this.wide!; j++) {
      temp[j] = { indice: j, posy: this.letters[j].posy };
    }
    temp.sort(sortPosy);
    for (let i = 0; i <= this.wide!; i++) {
      if (typeof this.sinparam != "undefined") {
        prov = 0;
        for (var j = 0; j < this.sinparam.length; j++) {
          if (this.type == 0)
            prov += Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp;
          if (this.type == 1)
            prov += -Math.abs(
              Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp
            );
          if (this.type == 2)
            prov += Math.abs(
              Math.sin(this.sinparam[j].myvalue) * this.sinparam[j].amp
            );
        }
      }
      this.font!.drawTile(
        this.dst!,
        this.letters[temp[i].indice].ltr - this.fontstart!,
        prov + posx,
        this.letters[temp[i].indice].posy
      );

      if (this.sinparam) {
        for (let j = 0; j < this.sinparam.length; j++) {
          this.sinparam[j].myvalue += this.sinparam[j].inc;
        }
      }
    }
    if (this.sinparam) {
      for (let j = 0; j < this.sinparam.length; j++) {
        this.sinparam[j].myvalue = oldvalue[j] + this.sinparam[j].offset;
      }
    }
    this.dst!.contex.globalAlpha = tmp;
  }
}
