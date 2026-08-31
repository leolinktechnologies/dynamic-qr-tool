import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  const serialNumber = params.id;

  // Supabase se URL fetch karo
  const { data, error } = await supabase
    .from("qrcodes")
    .select("target_url")
    .eq("serial_number", parseInt(serialNumber))
    .single();

  if (error || !data) {
    return new NextResponse("QR Code Not Found or Invalid Serial Number", { status: 404 });
  }

  // Destination URL par automatic redirect
  return NextResponse.redirect(data.target_url);
}