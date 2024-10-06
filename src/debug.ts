import debug from "debug";

export const log = debug("codef:debug");
export const log_music = debug("codef:music");
log.enabled = true;
log_music.enabled = true;
