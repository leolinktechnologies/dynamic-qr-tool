import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { PNG } from "pngjs";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "Target URL zaroori hai" }, { status: 400 });
    }

    // 1. Supabase mein record insert karein
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: targetUrl }])
      .select()
      .single();

    if (error) throw error;
    const serialNumber = data.serial_number;

    // 2. Base URL configuration
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "");
    const redirectUrl = `${cleanBaseUrl}/q/${serialNumber}`;

    // 3. Generate QR Code Buffer (PNG format, 2400x2400)
    const qrPngBuffer = await QRCode.toBuffer(redirectUrl, {
      type: "png",
      width: 2400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // 4. Parse PNG using pngjs (Vercel Serverless Safe)
    const png = PNG.sync.read(qrPngBuffer);

    // Center Box Coordinates (180x180 Box for 2400x2400 canvas)
    const boxSize = 180;
    const startX = Math.floor((2400 - boxSize) / 2);
    const startY = Math.floor((2400 - boxSize) / 2);

    // Draw White Box in Center
    for (let y = startY; y < startY + boxSize; y++) {
      for (let x = startX; x < startX + boxSize; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 255;     // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 255; // B
        png.data[idx + 3] = 255; // Alpha
      }
    }

    // 5. Convert PNG back to Base64
    const buffer = PNG.sync.write(png);
    const finalBase64 = `data:image/png;base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      serialNumber,
      qrImage: finalBase64,
    });
  } catch (err) {
    console.error("QR Generation Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}