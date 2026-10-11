import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient, configured } from "@/lib/supabase/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiUser() {
  if (!configured())
    throw new HttpError(
      503,
      "Supabase is not configured. Add your project settings to .env.local.",
    );
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Please sign in to continue.");
  return { db, user };
}
function isLoopback(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

function originsMatch(a: string, b: string) {
  if (a === b) return true;
  try {
    const urlA = new URL(a);
    const urlB = new URL(b);
    if (urlA.protocol === urlB.protocol && urlA.port === urlB.port) {
      if (isLoopback(urlA.hostname) && isLoopback(urlB.hostname)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export async function jsonBody(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.APP_ORIGIN || new URL(request.url).origin;
  const reqOrigin = new URL(request.url).origin;
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const hostOrigin = host ? `${new URL(request.url).protocol}//${host}` : null;

  if (
    origin &&
    !originsMatch(origin, allowed) &&
    !originsMatch(origin, reqOrigin) &&
    (!hostOrigin || !originsMatch(origin, hostOrigin))
  )
    throw new HttpError(403, "Request origin is not allowed.");
  const text = await request.text();
  if (text.length > 16000) throw new HttpError(413, "Request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Please check the form." },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("Request failed", {
    type: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "We could not save this change. Please try again." },
    { status: 500 },
  );
}
export async function mutate(action: string, payload: unknown) {
  const { db } = await apiUser();
  const { data, error } = await db.rpc("mutate_path", { action, payload });
  if (error) {
    console.error("Database mutation failed", { code: error.code });
    if (error.code === "P0001" || error.code === "23514")
      throw new HttpError(400, error.message);
    throw new HttpError(
      500,
      "We could not save your change. Please try again.",
    );
  }
  return data;
}
