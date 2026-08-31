import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("qrcodes")
      .select("serial_number")
      .order("serial_number", { ascending: false })
      .limit(1);

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Default 501 se start hoga agar table khali ho
    const lastSerial = data && data.length > 0 ? data[0].serial_number : 500;
    const nextSerial = lastSerial + 1;

    return NextResponse.json({ success: true, nextSerial });
  } catch (err) {
    return NextResponse.json({ success: false, nextSerial: 501 });
  }
}