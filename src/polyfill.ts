import { File as BufferFile } from 'node:buffer';

/**
 * Polyfill for Node.js 18 compatibility with modern libraries (like undici / cheerio)
 * that expect `File` to exist on globalThis.
 */
if (typeof (globalThis as any).File === 'undefined') {
  if (typeof BufferFile !== 'undefined') {
    (globalThis as any).File = BufferFile;
  } else {
    class FilePolyfill extends Blob {
      name: string;
      lastModified: number;
      constructor(fileBits: any[], fileName: string, options: any = {}) {
        super(fileBits, options);
        this.name = String(fileName);
        this.lastModified = options.lastModified || Date.now();
      }
    }
    (globalThis as any).File = FilePolyfill;
  }
}
