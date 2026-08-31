import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { Jit, Jimp } from "jimp";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "URL zaroori hai" }, { status: 400 });
    }

    // 1. Supabase mein record insert karein
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: targetUrl }])
      .select()
      .single();

    if (error) throw error;
    const serialNumber = data.serial_number;

    // 2. Base URL clean up
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "");
    const redirectUrl = `${cleanBaseUrl}/q/${serialNumber}`;

    // 3. Generate QR Code Base64 Buffer (2400x2400 High Res)
    const qrBuffer = await QRCode.toBuffer(redirectUrl, {
      width: 2400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // 4. Load Image using Jimp (Pure JS Engine - Vercel Safe)
    const image = await Jimp.read(qrBuffer);

    // Center Box Coordinates (2400x2400 image ke liye)
    const boxSize = 180;
    const startX = (2400 - boxSize) / 2;
    const startY = (2400 - boxSize) / 2;

    // Draw White Box in Center
    image.scan(startX, startY, boxSize, boxSize, function (x, y, offset) {
      this.bitmap.data[offset] = 255;     // Red
      this.bitmap.data[offset + 1] = 255; // Green
      this.bitmap.data[offset + 2] = 255; // Blue
      this.bitmap.data[offset + 3] = 255; // Alpha
    });

    // Convert processed image back to Base64
    const finalBase64 = await image.getBase64Async(Jimp.MIME_PNG);

    return NextResponse.json({
      success: true,
      serialNumber,
      qrImage: finalBase64,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}