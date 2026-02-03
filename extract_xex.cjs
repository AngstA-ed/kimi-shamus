#!/usr/bin/env node
/**
 * XEX File Parser and MAP Data Extractor
 * Atari 8-bit XEX files have a specific format with segments
 */

const fs = require('fs');
const path = require('path');

const XEX_FILE = 'Shamus+/Shamuspl.xex';
const OUTPUT_DIR = 'extracted_maze';

// XEX Header constants
const XEX_HEADER = Buffer.from([0xFF, 0xFF]);

function parseXEX(buffer) {
  console.log('=== XEX File Analysis ===');
  console.log(`File size: ${buffer.length} bytes`);
  
  // Check header
  if (buffer[0] !== 0xFF || buffer[1] !== 0xFF) {
    console.log('Warning: Invalid XEX header');
  }
  
  let offset = 2;
  const segments = [];
  
  // Parse segments
  while (offset < buffer.length - 4) {
    const byte1 = buffer[offset];
    const byte2 = buffer[offset + 1];
    
    // Check for special headers
    if (byte1 === 0xFF) {
      if (byte2 === 0xFF) {
        console.log(`  Double FF at offset ${offset.toString(16)}`);
        offset += 2;
        continue;
      }
      // Could be special marker
      console.log(`  FF marker at offset ${offset.toString(16)}: ${byte2.toString(16)}`);
      offset += 2;
      continue;
    }
    
    // Try to read as segment header (start addr, end addr)
    const startAddr = buffer[offset] + (buffer[offset + 1] << 8);
    const endAddr = buffer[offset + 2] + (buffer[offset + 3] << 8);
    const length = endAddr - startAddr + 1;
    
    // Sanity check for segment
    if (length > 0 && length < 0x10000 && offset + 4 + length <= buffer.length) {
      console.log(`\nSegment at offset ${offset.toString(16).padStart(4, '0')}:`);
      console.log(`  Start: $${startAddr.toString(16).padStart(4, '0')} (${startAddr})`);
      console.log(`  End:   $${endAddr.toString(16).padStart(4, '0')} (${endAddr})`);
      console.log(`  Length: ${length} bytes`);
      
      const data = buffer.slice(offset + 4, offset + 4 + length);
      segments.push({
        offset,
        startAddr,
        endAddr,
        length,
        data
      });
      
      offset += 4 + length;
    } else {
      // Not a valid segment header, skip
      offset++;
    }
  }
  
  console.log(`\n=== Found ${segments.length} potential segments ===`);
  
  // Look for MAP data patterns
  // According to PDF: 128 rooms, 5 segments per room
  // Total MAP size should be around 81920 bytes for full maze
  
  console.log('\n=== Searching for MAP data patterns ===');
  
  // Search for repeating patterns that could be room data
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    console.log(`\nSegment ${i}: $${seg.startAddr.toString(16)}-$${seg.endAddr.toString(16)} (${seg.length} bytes)`);
    
    // Check for room-like data structures
    // Room data typically has patterns with wall bytes (0x00-0x7F) and corridor bytes (0x80-0xFF)
    let wallBytes = 0;
    let corridorBytes = 0;
    let otherBytes = 0;
    
    for (let j = 0; j < Math.min(seg.length, 1000); j++) {
      const b = seg.data[j];
      if (b < 0x80) wallBytes++;
      else if (b >= 0x80) corridorBytes++;
      else otherBytes++;
    }
    
    console.log(`  Wall bytes: ${wallBytes}, Corridor bytes: ${corridorBytes}`);
    
    // If this looks like room data, save it
    if (seg.length >= 640 && seg.length <= 1000) {
      const outFile = path.join(OUTPUT_DIR, `segment_${i}_${seg.startAddr.toString(16).padStart(4,'0')}.bin`);
      fs.writeFileSync(outFile, seg.data);
      console.log(`  -> Saved to ${outFile}`);
    }
  }
  
  return segments;
}

// Main
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const buffer = fs.readFileSync(XEX_FILE);
parseXEX(buffer);

console.log('\n=== Extraction Complete ===');
