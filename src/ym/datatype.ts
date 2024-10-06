export class dataType {
  public pos: number = 0;
  public endian: "BIG" | "LITTLE" = "BIG";
  public data?: string;

  constructor() {}

  public readBytes(offset: number, nb: number) {
    var tmp = "";
    for (var i = 0; i < nb; i++) {
      tmp += this.data![offset + this.pos++];
    }
    return tmp;
  }

  public readMultiByte(nb: number, type: "txt" | string) {
    if (type == "txt") {
      var tmp = "";
      for (var i = 0; i < nb; i++) {
        tmp += this.data![this.pos++];
      }
      return tmp;
    }
  }

  public readInt() {
    var tmp1 = parseInt(
      this.data![this.pos + 0].charCodeAt(0).toString(16),
      16
    );
    var tmp2 = parseInt(
      this.data![this.pos + 1].charCodeAt(0).toString(16),
      16
    );
    var tmp3 = parseInt(
      this.data![this.pos + 2].charCodeAt(0).toString(16),
      16
    );
    var tmp4 = parseInt(
      this.data![this.pos + 3].charCodeAt(0).toString(16),
      16
    );
    if (this.endian == "BIG")
      var tmp = (tmp1 << 24) | (tmp2 << 16) | (tmp3 << 8) | tmp4;
    else var tmp = (tmp4 << 24) | (tmp3 << 16) | (tmp2 << 8) | tmp1;
    this.pos += 4;
    return tmp;
  }

  public readShort() {
    var tmp1 = parseInt(
      this.data![this.pos + 0].charCodeAt(0).toString(16),
      16
    );
    var tmp2 = parseInt(
      this.data![this.pos + 1].charCodeAt(0).toString(16),
      16
    );
    var tmp = (tmp1 << 8) | tmp2;
    this.pos += 2;
    return tmp;
  }

  public readByte() {
    var tmp = parseInt(this.data![this.pos].charCodeAt(0).toString(16), 16);
    this.pos += 1;
    return tmp;
  }
  public readString() {
    var tmp = "";
    while (1) {
      if (this.data![this.pos++].charCodeAt(0) != 0)
        tmp += this.data![this.pos - 1];
      else return tmp;
    }
  }

  // public substr(start: number, nb: number) {
  //   return this.data!.substr(start, nb);
  // }

  // public bytesAvailable() {
  //   return this.data!.length - this.pos;
  // }
}
