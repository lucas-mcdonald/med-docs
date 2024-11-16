import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const session = await auth();
  console.log(session);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    return NextResponse.json({ error: "Not implemented" }, { status: 400 });
  }
}
