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

    // 1. Database mein insert
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: targetUrl }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `Database Error: ${error.message}` }, { status: 500 });
    }

    const serialNumber = data.serial_number;

    // 2. Protocol Check aur Base URL Cleaning
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");

    if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
      rawBaseUrl = `https://${rawBaseUrl}`;
    }

    const redirectUrl = `${rawBaseUrl}/q/${serialNumber}`;

    // 3. Generate QR Code Buffer
    const qrPngBuffer = await QRCode.toBuffer(redirectUrl, {
      type: "png",
      width: 2400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // 4. Center White Box drawing
    const png = PNG.sync.read(qrPngBuffer);
    const boxSize = 180;
    const startX = Math.floor((2400 - boxSize) / 2);
    const startY = Math.floor((2400 - boxSize) / 2);

    for (let y = startY; y < startY + boxSize; y++) {
      for (let x = startX; x < startX + boxSize; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 255;
        png.data[idx + 1] = 255;
        png.data[idx + 2] = 255;
        png.data[idx + 3] = 255;
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