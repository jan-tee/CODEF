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

import { canvas } from "./core/canvas";
import { log } from "./debug";

/**
 * The MouseTracker seems to push the Mouse* properties to any subscribed canvas
 * into new fields Mouse*
 */
export class MouseTracker {
  canvases: canvas[] = [];

  constructor() {}

  addMouseTrack(cvs: canvas, ctxmenu: boolean) {
    this.canvases.push(cvs);
    (<any>cvs.canvas).MousePosXTmp = canvas.Mouse_UNTRACKED;
    (<any>cvs.canvas).MousePosYTmp = canvas.Mouse_UNTRACKED;
    (<any>cvs.canvas).MouseButtTmp = 0;
    cvs.MousePosX = canvas.Mouse_UNTRACKED;
    cvs.MousePosY = canvas.Mouse_UNTRACKED;
    cvs.MouseButt = 0;

    cvs.canvas.addEventListener(
      "mouseout",
      function () {
        (<any>this).MousePosXTmp = -1000000;
        (<any>this).MousePosYTmp = -1000000;
        // (<any>this).MouseButtTmp = 0;
      },
      false
    );

    cvs.canvas.addEventListener(
      "mousemove",
      function (ev: MouseEvent) {
        const rect = this.getBoundingClientRect();
        (<any>this).MousePosXTmp = Math.round(ev.clientX - rect.left);
        (<any>this).MousePosYTmp = Math.round(ev.clientY - rect.top);
      },
      false
    );

    cvs.canvas.addEventListener(
      "mousedown",
      (ev: MouseEvent) => {
        (<any>this).MouseButtTmp = 2; // ev.buttons;
        log("Mouse button on: %d", ev.buttons);
      },
      false
    );

    cvs.canvas.addEventListener(
      "mouseup",
      function () {
        (<any>this).MouseButtTmp = 0;
        log("Mouse button off: %d", 0);
      },
      false
    );

    if (ctxmenu == false) {
      cvs.canvas.addEventListener(
        "contextmenu",
        function (e: MouseEvent) {
          if (e.button === 2) {
            e.preventDefault();
            return false;
          }
        },
        false
      );
    }
  }

  MouseUpdate() {
    this.canvases.forEach((cvs, i) => {
      // log(
      //   "Mouse update took these buttons: %d",
      //   (<any>this.canvases[i].canvas).MouseButtTmp
      // );
      cvs.MouseButt = (<any>this.canvases[i].canvas).MouseButtTmp;
      cvs.MousePosX = (<any>this.canvases[i].canvas).MousePosXTmp;
      cvs.MousePosY = (<any>this.canvases[i].canvas).MousePosYTmp;
    });
  }
}
