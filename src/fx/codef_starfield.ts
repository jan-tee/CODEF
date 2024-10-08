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

export class starfield3D {
  test: boolean = true;
  x: number = 0;
  y: number = 0;
  z: number = 0;
  public n: number;
  star: any[];
  star_x_save: any;
  star_y_save: any;
  star_speed: number;
  star_ratio: number;
  star_color_ratio: number = 0;
  cursor_x: number;
  cursor_y: number;
  dst?: canvas;

  constructor(
    public dest: canvas,
    nb: number,
    speed: number,
    public w: number,
    public h: number,
    public centx: number,
    public centy: number,
    public color: string,
    ratio: number,
    public offsetx: number = 0,
    public offsety: number = 0
  ) {
    this.n = nb;
    this.star = new Array(this.n);
    this.star_speed = speed;
    this.star_ratio = ratio;
    this.x = Math.round(this.w / 2);
    this.y = Math.round(this.h / 2);
    this.z = (this.w + this.h) / 2;
    this.star_color_ratio = 1 / this.z;
    this.cursor_x = this.x;
    this.cursor_y = this.y;

    for (var i = 0; i < this.n; i++) {
      this.star[i] = new Array(5);
      this.star[i][0] = Math.random() * this.w * 2 - this.x * 2;
      this.star[i][1] = Math.random() * this.h * 2 - this.y * 2;
      this.star[i][2] = Math.round(Math.random() * this.z);
      this.star[i][3] = 0;
      this.star[i][4] = 0;
    }
  }

  draw() {
    var tmp = this.dest.contex.strokeStyle;
    var tmp2 = this.dest.contex.globalAlpha;
    var tmp3 = this.dest.contex.lineWidth;
    this.dest.contex.globalAlpha = 1;
    this.dest.contex.strokeStyle = this.color;

    for (var i = 0; i < this.n; i++) {
      this.test = true;
      this.star_x_save = this.star[i][3];
      this.star_y_save = this.star[i][4];
      this.star[i][0] += (this.centx - this.x) >> 4;
      if (this.star[i][0] > this.x << 1) {
        this.star[i][0] -= this.w << 1;
        this.test = false;
      }
      if (this.star[i][0] < -this.x << 1) {
        this.star[i][0] += this.w << 1;
        this.test = false;
      }
      this.star[i][1] += (this.centy - this.y) >> 4;
      if (this.star[i][1] > this.y << 1) {
        this.star[i][1] -= this.h << 1;
        this.test = false;
      }
      if (this.star[i][1] < -this.y << 1) {
        this.star[i][1] += this.h << 1;
        this.test = false;
      }
      this.star[i][2] -= this.star_speed;
      if (this.star[i][2] > this.z) {
        this.star[i][2] -= this.z;
        this.test = false;
      }
      if (this.star[i][2] < 0) {
        this.star[i][2] += this.z;
        this.test = false;
      }
      this.star[i][3] =
        this.x + (this.star[i][0] / this.star[i][2]) * this.star_ratio;
      this.star[i][4] =
        this.y + (this.star[i][1] / this.star[i][2]) * this.star_ratio;
      if (
        this.star_x_save > 0 &&
        this.star_x_save < this.w &&
        this.star_y_save > 0 &&
        this.star_y_save < this.h &&
        this.test
      ) {
        this.dest.contex.lineWidth =
          (1 - this.star_color_ratio * this.star[i][2]) * 2;
        this.dest.contex.beginPath();
        this.dest.contex.moveTo(
          this.star_x_save + this.offsetx,
          this.star_y_save + this.offsety
        );
        this.dest.contex.lineTo(
          this.star[i][3] + this.offsetx,
          this.star[i][4] + this.offsety
        );
        this.dest.contex.stroke();
        this.dest.contex.closePath();
      }
    }
    this.dest.contex.strokeStyle = tmp;
    this.dest.contex.globalAlpha = tmp2;
    this.dest.contex.lineWidth = tmp3;
  }
}

export class starfield2D_dot {
  stars: any[] = [];

  constructor(
    public dst: canvas,
    params: {
      speedx: number;
      speedy: number;
      color: string;
      size: number;
      nb: number;
    }[]
  ) {
    var t = 0;

    for (var i = 0; i < params.length; i++) {
      for (var j = 0; j < params[i].nb; j++) {
        this.stars[t] = {
          x: Math.random() * this.dst.canvas.width,
          y: Math.random() * this.dst.canvas.height,
          speedx: params[i].speedx,
          speedy: params[i].speedy,
          color: params[i].color,
          size: params[i].size,
        };
        t++;
      }
    }
  }

  draw() {
    for (var i = 0; i < this.stars.length; i++) {
      this.dst.plot(
        this.stars[i].x,
        this.stars[i].y,
        this.stars[i].size,
        this.stars[i].color
      );
      this.stars[i].x += this.stars[i].speedx;
      this.stars[i].y += this.stars[i].speedy;
      if (this.stars[i].x > this.dst.canvas.width) this.stars[i].x = 0;
      if (this.stars[i].x < 0) this.stars[i].x = this.dst.canvas.width;
      if (this.stars[i].y > this.dst.canvas.height) this.stars[i].y = 0;
      if (this.stars[i].y < 0) this.stars[i].y = this.dst.canvas.height;
    }
  }
}

export class starfield2D_img {
  stars: any[] = [];
  constructor(
    public dst: canvas,
    public img: image[],
    params: {
      speedx: number;
      speedy: number;
      params: any;
      nb: number;
    }[]
  ) {
    var t = 0;

    for (var i = 0; i < params.length; i++) {
      for (var j = 0; j < params[i].nb; j++) {
        this.stars[t] = {
          x: Math.random() * this.dst.canvas.width,
          y: Math.random() * this.dst.canvas.height,
          speedx: params[i].speedx,
          speedy: params[i].speedy,
          params: params[i].params,
        };
        t++;
      }
    }
  }

  draw() {
    for (var i = 0; i < this.stars.length; i++) {
      this.dst.contex.drawImage(
        this.img[this.stars[i].params].img,
        this.stars[i].x,
        this.stars[i].y
      );
      this.stars[i].x += this.stars[i].speedx;
      this.stars[i].y += this.stars[i].speedy;
      if (this.stars[i].x > this.dst.canvas.width)
        this.stars[i].x = 0 - this.img[this.stars[i].params].img.width;
      if (this.stars[i].x < 0 - this.img[this.stars[i].params].img.width)
        this.stars[i].x = this.dst.canvas.width;
      if (this.stars[i].y > this.dst.canvas.height)
        this.stars[i].y = 0 - this.img[this.stars[i].params].img.height;
      if (this.stars[i].y < 0 - this.img[this.stars[i].params].img.height)
        this.stars[i].y = this.dst.canvas.height;
    }
  }
}
