import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { benutzerId, deviceHash } = body;

    return NextResponse.json({
      ok: true,
      benutzerId,
      deviceHash,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "EXCEPTION",
        detail: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
