import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createCanvas } from "canvas";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "URL zaroori hai" }, { status: 400 });
    }

    // 1. Supabase mein record save karo (Serial number 501 se start hoga)
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: targetUrl }])
      .select()
      .single();

    if (error) throw error;
    const serialNumber = data.serial_number;

    // 2. Base URL set karein
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, ""); // Remove trailing slash
    const redirectUrl = `${cleanBaseUrl}/q/${serialNumber}`;

    // 3. Generate High-Res 2400x2400 Data URL using QRCode package directly
    const qrDataUrl = await QRCode.toDataURL(redirectUrl, {
      width: 2400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // 4. Draw Center Box & Serial Number using Canvas
    const canvas = createCanvas(2400, 2400);
    const ctx = canvas.getContext("2d");

    // QR Code Image Load karke canvas par draw karein
    const img = new (require("canvas").Image)();
    img.src = qrDataUrl;
    ctx.drawImage(img, 0, 0, 2400, 2400);

    // Center Overlay (White Box + Small Serial Number)
    const boxSize = 180;
    const centerX = (2400 - boxSize) / 2;
    const centerY = (2400 - boxSize) / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(centerX, centerY, boxSize, boxSize);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(centerX, centerY, boxSize, boxSize);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${serialNumber}`, 1200, 1200);

    // Final High-Res Image Data String
    const finalPngBuffer = canvas.toDataURL("image/png");

    return NextResponse.json({
      success: true,
      serialNumber,
      qrImage: finalPngBuffer,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}