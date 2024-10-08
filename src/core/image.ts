import { canvas } from "./canvas";

/**
        <b>Create an image object and load a remote/local png/gif/jpg in it.</b><br>
        image(img)<br>

        @class image
        @param {string} img_url local or url to an jpg/png/gif image.
        @property {Object} img the dom image object.
        @property {Number in pixel} handlex the x coord of the handle (0 by default).
        @property {Number in pixel} handley the y coord of the handle (0 by default).
        @property {Number in pixel} tilew the Width of a tile (IF this canvas is a tileset).
        @property {Number in pixel} tileh the Height of a tile (IF this canvas is a tileset).
        @property {Number} tilestart the number of the first tile (usefull for tileset like font).
	@example
	// with a local file
	var mylogo = new image('logo.png');

	// with a remote image
	var mylogo = new image('http://www.myremotesite.com/logo.png');

*/
export class image {
  public img: HTMLImageElement;
  public handlex = 0;
  public handley = 0;
  public midhandled = false;
  public tilew = 0;
  public tileh = 0;
  public tilestart = 0;

  constructor(public img_url: string) {
    this.img = new Image();
    this.img.src = img_url;
  }

  /**
                <b>Init a tileset image.</b><br>
                image.initTile(tilew,tileh, tilestart)<br>

                @function image.initTile
                @param {Number in pixel} tilew The Width of one tile.
                @param {Number in pixel} tileh The Height of one tile.
                @param {Number} [tilestart] The number of the first tile. (0 by default)
		@example
		myimage.initTile(32,32);
        */
  public initTile(tilew: number, tileh: number, tilestart: number) {
    this.tileh = tileh;
    this.tilew = tilew;
    if (typeof tilestart != "undefined") this.tilestart = tilestart;
  }

  /**
                <b>Draw the image to a canvas.</b><br>
                image.draw(dst,x,y,alpha, rot,w,h)<br>

                @function image.draw
                @param {Object} dst The destination canvas.
                @param {Number in pixel} x The x coord in the destination canvas (based on the handle coord of the image).
                @param {Number in pixel} y The y coord in the destination canvas (based on the handle coord of the image).
                @param {Number} [alpha] The normalized value of the alpha (1 by default).
                @param {Number} [rot] The rotation angle in degrees (0 by default) (will use the handle coord as rotation axis).
                @param {Number} [w] The normalized zoom factor on x (1 by default).
                @param {Number} [h] The normalized zoom factor on y (1 by default).
		@example
		myimage.draw(destcanvas,10,10,1,0,1,1);
        */
  public draw(
    dst: canvas,
    x: number,
    y: number,
    alpha: number = 1,
    rot: number = 0,
    w: number = 1,
    h: number = 1
  ) {
    var tmp = dst.contex.globalAlpha;
    if (typeof alpha == "undefined") alpha = 1;
    dst.contex.globalAlpha = alpha;
    if (arguments.length == 3 || arguments.length == 4)
      dst.contex.drawImage(this.img, x - this.handlex, y - this.handley);
    else if (arguments.length == 5) {
      dst.contex.translate(x, y);
      dst.contex.rotate((rot * Math.PI) / 180);
      dst.contex.translate(-this.handlex, -this.handley);
      dst.contex.drawImage(this.img, 0, 0);
      dst.contex.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      dst.contex.translate(x, y);
      dst.contex.rotate((rot * Math.PI) / 180);
      dst.contex.scale(w, h);
      dst.contex.translate(-this.handlex, -this.handley);
      dst.contex.drawImage(this.img, 0, 0);
      dst.contex.setTransform(1, 0, 0, 1, 0, 0);
    }
    dst.contex.globalAlpha = tmp;
  }

  /**
                <b>Draw a tile from this image to a canvas.</b><br>
                image.drawTile(dst, nb, x, y, alpha, rot, w, h)<br>

                @function image.drawTile
                @param {Object} dst The destination canvas.
                @param {Number} nb the tile number.
                @param {Number in pixel} x The x coord in the destination canvas (based on the handle coord of the image).
                @param {Number in pixel} y The y coord in the destination canvas (based on the handle coord of the image).
                @param {Number} [alpha] The normalized value of the alpha (1 by default).
                @param {Number} [rot] The rotation angle in degrees (0 by default) (will use the handle coord as rotation axis).
                @param {Number} [w] The normalized zoom factor on x (1 by default).
                @param {Number} [h] The normalized zoom factor on y (1 by default).
		@example
		myimage.drawTile(destcanvas,5,10,10,1,0,1,1);
        */
  public drawTile(
    dst: canvas,
    nb: number,
    x: number,
    y: number,
    alpha: number = 1,
    rot: number = 0,
    w: number = 1,
    h: number = 1
  ) {
    var tmp = dst.contex.globalAlpha;
    if (typeof alpha == "undefined") alpha = 1;
    dst.contex.globalAlpha = alpha;
    this.drawPart(
      dst,
      x,
      y,
      Math.floor(nb % (this.img.width / this.tilew)) * this.tilew,
      Math.floor(nb / (this.img.width / this.tilew)) * this.tileh,
      this.tilew,
      this.tileh,
      alpha,
      rot,
      w,
      h
    );
    dst.contex.globalAlpha = tmp;
  }

  /**
                <b>Draw a part of this image to a canvas.</b><br>
                image.drawPart(dst,x,y,partx,party,partw,parth,alpha, rot,zx,zy)<br>

                @function image.drawPart
                @param {Object} dst The destination canvas.
                @param {Number in pixel} x The x coord in the destination canvas (based on the handle coord of the image).
                @param {Number in pixel} y The y coord in the destination canvas (based on the handle coord of the image).
                @param {Number in pixel} partx The x coord of the part in the source canvas.
                @param {Number in pixel} party The y coord of the part in the source canvas.
                @param {Number in pixel} partw The width of the part in the source canvas.
                @param {Number in pixel} parth The height of the part in the source canvas.
                @param {Number} [alpha] The normalized value of the alpha (1 by default).
                @param {Number} [rot] The rotation angle in degrees (0 by default) (will use the handle coord as rotation axis).
                @param {Number} [zx] The normalized zoom factor on x (1 by default).
                @param {Number} [zy] The normalized zoom factor on y (1 by default).
		@example
		myimage.drawTile(mycanvas,10,10,0,0,50,50,1,0,1,1);
        */
  public drawPart(
    dst: canvas,
    x: number,
    y: number,
    partx: number,
    party: number,
    partw: number,
    parth: number,
    alpha: number = 1,
    rot: number = 0,
    zx: number = 1,
    zy: number = 1
  ) {
    if (partx < 0) {
      x -= partx / (this.midhandled == true ? 2 : 1);
      partw += partx;
      partx = 0;
    } else {
      if (this.midhandled == false) {
        partw = Math.min(partw, this.img.width - partx);
      }
    }
    if (party < 0) {
      y -= party / (this.midhandled == true ? 2 : 1);
      parth += party;
      party = 0;
    } else {
      if (this.midhandled == false) {
        parth = Math.min(parth, this.img.height - party);
      }
    }
    if (partw <= 0 || parth <= 0) {
      return;
    }
    var tmp = dst.contex.globalAlpha;
    // if (typeof alpha == "undefined") alpha = 1;
    dst.contex.globalAlpha = alpha;
    if (arguments.length == 7 || arguments.length == 8) {
      dst.contex.translate(x, y);
      if (this.midhandled == true) dst.contex.translate(-partw / 2, -parth / 2);
      else dst.contex.translate(-this.handlex, -this.handley);
      dst.contex.drawImage(
        this.img,
        partx,
        party,
        partw,
        parth,
        null,
        null,
        partw,
        parth
      );
      dst.contex.setTransform(1, 0, 0, 1, 0, 0);
    } else if (arguments.length == 9) {
      dst.contex.translate(x, y);
      dst.contex.rotate((rot * Math.PI) / 180);
      if (this.midhandled == true) dst.contex.translate(-partw / 2, -parth / 2);
      else dst.contex.translate(-this.handlex, -this.handley);
      dst.contex.drawImage(
        this.img,
        partx,
        party,
        partw,
        parth,
        null,
        null,
        partw,
        parth
      );
      dst.contex.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      dst.contex.translate(x, y);
      dst.contex.rotate((rot * Math.PI) / 180);
      dst.contex.scale(zx, zy);
      if (this.midhandled == true) dst.contex.translate(-partw / 2, -parth / 2);
      else dst.contex.translate(-this.handlex, -this.handley);
      dst.contex.drawImage(
        this.img,
        partx,
        party,
        partw,
        parth,
        null,
        null,
        partw,
        parth
      );
      dst.contex.setTransform(1, 0, 0, 1, 0, 0);
    }
    dst.contex.globalAlpha = tmp;
  }

  /**
                <b>Set the handle coord of this image to the center.</b><br>

                @function image.setmidhandle
		@example
		myimage.setmidhandle();
        */
  public setmidhandle() {
    this.handlex = this.img.width / 2;
    this.handley = this.img.height / 2;
    this.midhandled = true;
  }

  /**
                <b>Set the handle of the image.</b><br>
                image.sethandle(x,y)<br>

                @function image.sethandle
                @param {Number in pixel} x The x coord of the handle of the image.
                @param {Number in pixel} y The y coord of the handle of the image.
		@example
		myimage.sethandle(50,50);
        */
  public sethandle(x: number, y: number) {
    this.handlex = x;
    this.handley = y;
    this.midhandled = false;
  }

  public print(
    dst: canvas,
    str: string,
    x: number,
    y: number,
    alpha: number,
    rot: number,
    w: number,
    h: number
  ) {
    for (var i = 0; i < str.length; i++) {
      if (typeof w != "undefined")
        this.drawTile(
          dst,
          str[i].charCodeAt(0) - this.tilestart,
          x + i * this.tilew * w,
          y,
          alpha,
          rot,
          w,
          h
        );
      else
        this.drawTile(
          dst,
          str[i].charCodeAt(0) - this.tilestart,
          x + i * this.tilew,
          y,
          alpha,
          rot,
          w,
          h
        );
    }
  }
}
