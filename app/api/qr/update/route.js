import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { serialNumber, newUrl } = await req.json();

    if (!serialNumber || !newUrl) {
      return NextResponse.json({ success: false, error: "Serial Number aur New URL dono chahiye" }, { status: 400 });
    }

    // Database mein serial number search karke link update karo
    const { data, error } = await supabase
      .from("qrcodes")
      .update({ target_url: newUrl })
      .eq("serial_number", parseInt(serialNumber))
      .select();

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: false, error: "Yeh Serial Number nahi mila!" }, { status: 44 });
    }

    return NextResponse.json({ success: true, message: `Serial #${serialNumber} ka link update ho gaya!` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}