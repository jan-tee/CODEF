import "./codef_core";
import { grad } from "./codef_gradient";
import { MouseTracker } from "./codef_mouse";
import { music } from "./codef_music";
import { canvas } from "./core/canvas";
import { image } from "./core/image";
import { log } from "./debug";
import { FX } from "./fx/codef_fx";
import {
  ltrobj,
  scrolltext_horizontal,
  scrolltext_vertical,
} from "./fx/codef_scrolltext";
import {
  starfield2D_dot,
  starfield2D_img,
  starfield3D,
} from "./fx/codef_starfield";
import "./neoart.js";

log("CODEF init");

(<any>window).image = image;
(<any>window).canvas = canvas;
(<any>window).music = music;
(<any>window).grad = grad;
(<any>window).scrolltext_horizontal = scrolltext_horizontal;
(<any>window).scrolltext_vertical = scrolltext_vertical;
(<any>window).ltrobj = ltrobj;
(<any>window).FX = FX;
(<any>window).starfield2D_dot = starfield2D_dot;
(<any>window).starfield2D_img = starfield2D_img;
(<any>window).starfield3D = starfield3D;
(<any>window).MouseTracker = MouseTracker;
