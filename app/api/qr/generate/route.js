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

    // 1. Supabase mein record save karo
    const { data, error } = await supabase
      .from("qrcodes")
      .insert([{ target_url: targetUrl }])
      .select()
      .single();

    if (error) throw error;
    const serialNumber = data.serial_number;

    // 2. Safe Base URL Handling (Removes trailing slashes to prevent invalid path errors)
    let rawBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, ""); // Trim trailing slashes
    
    // Dynamic Redirection Link
    const redirectUrl = `${cleanBaseUrl}/q/${serialNumber}`;

    // 3. 2400 x 2400 High Resolution Canvas Setup
    const width = 2400;
    const height = 2400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Temp Canvas for QR with High Error Correction
    const qrCanvas = createCanvas(width, height);
    await QRCode.toCanvas(qrCanvas, redirectUrl, {
      width: width,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // Draw QR on main canvas
    ctx.drawImage(qrCanvas, 0, 0);

    // 4. Center Overlay Drawing (White box + Small Serial Number)
    const boxSize = 180;
    const centerX = (width - boxSize) / 2;
    const centerY = (height - boxSize) / 2;

    // White box in center
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(centerX, centerY, boxSize, boxSize);

    // Border around white box
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(centerX, centerY, boxSize, boxSize);

    // Small Text (Serial Number) in Center
    ctx.fillStyle = "#000000";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${serialNumber}`, width / 2, height / 2);

    // Convert to Base64 Image String
    const pngBuffer = canvas.toDataURL("image/png");

    return NextResponse.json({
      success: true,
      serialNumber,
      qrImage: pngBuffer,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}