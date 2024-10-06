/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// LHA depack routine
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { dataType } from "./datatype";

export class LHa {
  source: any;
  srcSize: any;
  dstSize: any;
  srcPos: any;
  dstPos: any;

  bitBuffer: any;
  bitCount: any;
  subBuffer: any;
  blockSize: any;
  fillBufferSize: any;
  fillIndex: any;
  decodei: any;
  decodej: any;

  data: any = "";
  buffer: any = new Array();
  output: any = new Array();

  c_Table: any = new Array();
  p_Table: any = new Array();
  c_Len: any = new Array();
  p_Len: any = new Array();
  l_Tree: any = new Array();
  r_Tree: any = new Array();

  header?: LHaHeader;

  constructor() {}

  unpack(source: any) {
    this.header = new LHaHeader(source);
    if (
      this.header.size == 0 ||
      this.header.method != "-lh5-" ||
      this.header.level != 0
    )
      return source.data;

    this.source = source;
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

    var l = this.dstSize;
    var n;
    var np;

    while (l != 0) {
      n = l > 8192 ? 8192 : l;
      this.decode(n);
      np = n > this.dstSize ? this.dstSize : n;

      if (np > 0) {
        this.output.pos = 0;
        for (var yop = 0; yop < np; yop++) {
          this.data += String.fromCharCode(this.output[yop]);
        }
        this.dstPos += np;
        this.dstSize -= np;
      }

      l -= n;
    }

    this.buffer = "";
    this.output = new Array();
    return this.data;
  }

  decode(count: number) {
    var c;
    var r = 0;

    while (--this.decodej >= 0) {
      this.output[r] = this.output[this.decodei];
      this.decodei = ++this.decodei & 8191;
      if (++r == count) return;
    }

    for (;;) {
      c = this.decode_c();

      if (c <= 255) {
        this.output[r] = c;
        if (++r == count) return;
      } else {
        this.decodej = c - 253;
        this.decodei = (r - this.decode_p() - 1) & 8191;

        while (--this.decodej >= 0) {
          this.output[r] = this.output[this.decodei];
          this.decodei = ++this.decodei & 8191;
          if (++r == count) return;
        }
      }
    }
  }

  decode_c() {
    var j;
    var mask = 0;

    if (this.blockSize == 0) {
      this.blockSize = this.getBits(16);
      this.read_p(19, 5, 3);
      this.read_c();
      this.read_p(14, 4, -1);
    }

    this.blockSize--;
    j = this.c_Table[this.bitBuffer >> 4];

    if (j >= 510) {
      mask = 1 << 3;

      do {
        j = this.bitBuffer & mask ? this.r_Tree[j] : this.l_Tree[j];
        mask >>= 1;
      } while (j >= 510);
    }

    this.fillBuffer(this.c_Len[j]);
    return j & 0xffff;
  }

  decode_p() {
    var j = this.p_Table[this.bitBuffer >> 8];
    var mask = 0;

    if (j >= 14) {
      mask = 1 << 7;

      do {
        j = this.bitBuffer & mask ? this.r_Tree[j] : this.l_Tree[j];
        mask >>= 1;
      } while (j >= 14);
    }

    this.fillBuffer(this.p_Len[j]);
    if (j != 0) j = (1 << (j - 1)) + this.getBits(j - 1);
    return j & 0xffff;
  }

  read_c() {
    var c;
    var i = 0;
    var mask = 0;
    var n = this.getBits(9);

    if (n == 0) {
      c = this.getBits(9);
      for (i = 0; i < 510; ++i) this.c_Len[i] = 0;
      for (i = 0; i < 4096; ++i) this.c_Table[i] = c;
    } else {
      while (i < n) {
        c = this.p_Table[this.bitBuffer >> 8];

        if (c >= 19) {
          mask = 1 << 7;
          do {
            c = this.bitBuffer & mask ? this.r_Tree[c] : this.l_Tree[c];
            mask >>= 1;
          } while (c >= 19);
        }

        this.fillBuffer(this.p_Len[c]);

        if (c <= 2) {
          if (c == 0) c = 1;
          else if (c == 1) c = this.getBits(4) + 3;
          else c = this.getBits(9) + 20;

          while (--c >= 0) this.c_Len[i++] = 0;
        } else {
          this.c_Len[i++] = c - 2;
        }
      }

      while (i < 510) this.c_Len[i++] = 0;
      this.makeTable(510, this.c_Len, 12, this.c_Table);
    }
  }

  read_p(nn: number, nbit: number, iSpecial: number) {
    var c;
    var i = 0;
    var mask = 0;
    var n = this.getBits(nbit);

    if (n == 0) {
      c = this.getBits(nbit);
      for (i = 0; i < nn; ++i) this.p_Len[i] = 0;
      for (i = 0; i < 256; ++i) this.p_Table[i] = c;
    } else {
      while (i < n) {
        c = this.bitBuffer >> 13;

        if (c == 7) {
          mask = 1 << 12;

          while (mask & this.bitBuffer) {
            mask >>= 1;
            c++;
          }
        }

        this.fillBuffer(c < 7 ? 3 : c - 3);
        this.p_Len[i++] = c;

        if (i == iSpecial) {
          c = this.getBits(2);
          while (--c >= 0) this.p_Len[i++] = 0;
        }
      }

      while (i < nn) this.p_Len[i++] = 0;
      this.makeTable(nn, this.p_Len, 8, this.p_Table);
    }
  }

  getBits(n: number) {
    var r = this.bitBuffer >> (16 - n);
    this.fillBuffer(n);
    return r & 0xffff;
  }

  fillBuffer(n: number) {
    var np;

    this.bitBuffer = (this.bitBuffer << n) & 0xffff;

    while (n > this.bitCount) {
      this.bitBuffer |= this.subBuffer << (n -= this.bitCount);
      this.bitBuffer &= 0xffff;

      if (this.fillBufferSize == 0) {
        this.fillIndex = 0;
        np = this.srcSize > 4064 ? 4064 : this.srcSize;

        if (np > 0) {
          this.source.pos = this.srcPos;
          this.buffer = this.source.readBytes(0, np);
          this.srcPos += np;
          this.srcSize -= np;
        }

        this.fillBufferSize = np;
      }

      if (this.fillBufferSize > 0) {
        this.fillBufferSize--;
        this.subBuffer = this.buffer[this.fillIndex++].charCodeAt(0);
      } else {
        this.subBuffer = 0;
      }

      this.bitCount = 8;
    }

    this.bitBuffer |= this.subBuffer >> (this.bitCount -= n);
    this.bitBuffer &= 0xffff;
  }

  makeTable(nchar: number, bitlen: number[], tablebits: number, table: any[]) {
    var a = nchar;
    var h;
    var i;
    var j;
    var k;
    var l;
    var n;
    var p;
    var t;
    var r;
    var c = new Array();
    var w = new Array();
    var s = new Array();
    var mask = 1 << (15 - tablebits);
    for (i = 0; i < nchar; ++i) c[i] = 0;

    for (i = 0; i < nchar; ++i) c[bitlen[i]]++;

    s[1] = 0;
    for (i = 1; i < 17; ++i) s[i + 1] = (s[i] + (c[i] << (16 - i))) & 0xffff;

    if (s[17] != 0) return false;
    j = 16 - tablebits;

    for (i = 1; i <= tablebits; ++i) {
      s[i] >>= j;
      w[i] = 1 << (tablebits - i);
    }

    while (i < 17) w[i] = 1 << (16 - i++);
    i = s[tablebits + 1] >> j;

    if (i != 0) {
      k = 1 << tablebits;
      while (i != k) table[i++] = 0;
    }

    for (h = 0; h < nchar; ++h) {
      if ((l = bitlen[h]) == 0) continue;
      n = s[l] + w[l];

      if (l <= tablebits) {
        for (i = s[l]; i < n; ++i) table[i] = h;
      } else {
        i = l - tablebits;
        k = s[l];
        p = k >> j;
        t = table;

        while (i != 0) {
          if (t[p] == 0) {
            this.l_Tree[a] = 0;
            this.r_Tree[a] = 0;
            t[p] = a++;
          }

          r = k & mask ? this.r_Tree : this.l_Tree;
          k <<= 1;
          i--;
        }

        r[t[p]] = h;
      }
      s[l] = n;
    }

    return true;
  }
}

class LHaHeader {
  size: number;
  checksum: number;
  method?: string;
  packed: number;
  original: number;
  timeStamp: number;
  attribute: number;
  level: number;
  nameLength: number;
  name?: string;

  constructor(source: dataType) {
    source.endian = "LITTLE";
    source.pos = 0;

    this.size = source.readByte();
    this.checksum = source.readByte();
    this.method = source.readMultiByte(5, "txt");
    this.packed = source.readInt();
    this.original = source.readInt();
    this.timeStamp = source.readInt();
    this.attribute = source.readByte();
    this.level = source.readByte();
    this.nameLength = source.readByte();
    this.name = source.readMultiByte(this.nameLength, "txt");
    source.readShort();
  }
}
