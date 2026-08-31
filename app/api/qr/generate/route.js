import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { PNG } from "pngjs";
import { supabase } from "@/lib/supabase";

// Minimal 5x7 Pixel Font Map for rendering numbers 0-9 inside PNG
const FONT_5X7 = {
  '0': [ [1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1] ],
  '1': [ [0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1] ],
  '2': [ [1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1] ],
  '3': [ [1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1] ],
  '4': [ [1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1] ],
  '5': [ [1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1] ],
  '6': [ [1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1] ],
  '7': [ [1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0] ],
  '8': [ [1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1] ],
  '9': [ [1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1] ],
  '#': [ [0,1,0,1,0],[1,1,1,1,1],[0,1,0,1,0],[1,1,1,1,1],[0,1,0,1,0] ]
};

export async function POST(req) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "Target URL zaroori hai" }, { status: 400 });
    }

    // Target URL Normalization (Auto-add https:// if protocol missing)
    let cleanTargetUrl = targetUrl.trim();
    if (!cleanTargetUrl.startsWith("http://") && !cleanTargetUrl.startsWith("https://")) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }

    // 1. Supabase Record Insert
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: cleanTargetUrl }])
      .select()
      .single();

    if (error) throw error;
    const serialNumber = data.serial_number;

    // 2. Dynamic Base URL
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
      rawBaseUrl = `https://${rawBaseUrl}`;
    }
    const redirectUrl = `${rawBaseUrl}/q/${serialNumber}`;

    // 3. Generate High-Res 2400x2400 QR
    const qrPngBuffer = await QRCode.toBuffer(redirectUrl, {
      type: "png",
      width: 2400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    const png = PNG.sync.read(qrPngBuffer);
    
    // 4. White Center Box
    const boxSize = 220;
    const startX = Math.floor((2400 - boxSize) / 2);
    const startY = Math.floor((2400 - boxSize) / 2);

    for (let y = startY; y < startY + boxSize; y++) {
      for (let x = startX; x < startX + boxSize; x++) {
        const idx = (png.width * y + x) << 2;
        // Border thickness
        const isBorder = (y < startY + 8 || y > startY + boxSize - 9 || x < startX + 8 || x > startX + boxSize - 9);
        const color = isBorder ? 0 : 255;
        
        png.data[idx] = color;
        png.data[idx + 1] = color;
        png.data[idx + 2] = color;
        png.data[idx + 3] = 255;
      }
    }

    // 5. Draw Typed Serial Number in Center Box
    const serialStr = `${serialNumber}`;
    const pixelScale = 16; // Text size scale
    const charWidth = 3 * pixelScale;
    const charSpacing = 2 * pixelScale;
    const totalWidth = (serialStr.length * charWidth) + ((serialStr.length - 1) * charSpacing);
    
    const textStartX = Math.floor((2400 - totalWidth) / 2);
    const textStartY = Math.floor((2400 - (5 * pixelScale)) / 2);

    for (let i = 0; i < serialStr.length; i++) {
      const char = serialStr[i];
      const fontGrid = FONT_5X7[char] || FONT_5X7['0'];
      const charXOffset = textStartX + i * (charWidth + charSpacing);

      for (let r = 0; r < fontGrid.length; r++) {
        for (let c = 0; c < fontGrid[r].length; c++) {
          if (fontGrid[r][c] === 1) {
            // Draw pixel block
            for (let py = 0; py < pixelScale; py++) {
              for (let px = 0; px < pixelScale; px++) {
                const drawX = charXOffset + (c * pixelScale) + px;
                const drawY = textStartY + (r * pixelScale) + py;
                const idx = (png.width * drawY + drawX) << 2;
                
                png.data[idx] = 0;       // R
                png.data[idx + 1] = 0;   // G
                png.data[idx + 2] = 0;   // B
                png.data[idx + 3] = 255; // Alpha
              }
            }
          }
        }
      }
    }

    const buffer = PNG.sync.write(png);
    const finalBase64 = `data:image/png;base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      serialNumber,
      qrImage: finalBase64,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}