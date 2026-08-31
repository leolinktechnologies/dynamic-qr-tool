import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    // Next.js ke async params resolve karein
    const resolvedParams = await params;
    const serialNumber = parseInt(resolvedParams.id, 10);

    if (isNaN(serialNumber)) {
      return new NextResponse("Invalid Serial Number Format", { status: 400 });
    }

    // Supabase se target URL fetch karein
    const { data, error } = await supabase
      .from("qrcodes")
      .select("target_url")
      .eq("serial_number", serialNumber)
      .single();

    if (error || !data) {
      console.error("QR Fetch Error:", error);
      return new NextResponse(`QR Code #${serialNumber} Not Found in Database`, { status: 404 });
    }

    let destination = data.target_url.trim();

    // Agar user ne web link mein https:// nahi lagaya tha, toh ensure karein
    if (!destination.startsWith("http://") && !destination.startsWith("https://")) {
      destination = `https://${destination}`;
    }

    // Direct redirection
    return NextResponse.redirect(destination, 307);
  } catch (err) {
    console.error("Redirect Route Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}