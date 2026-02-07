import { ChatRequest } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

async function getIdToken(audience: string): Promise<string> {
  const metadataUrl =
    `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${audience}`;
  const res = await fetch(metadataUrl, {
    headers: { "Metadata-Flavor": "Google" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ID token: ${res.status}`);
  }
  return res.text();
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: ChatRequest = await req.json();

    const agentServiceUrl = process.env.AGENT_SERVICE_URL;
    if (!agentServiceUrl) {
      return NextResponse.json(
        { error: "AGENT_SERVICE_URL is not configured" },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Cloud Run authentication when running on GCP
    if (!process.env.LOCAL_DEV) {
      try {
        const token = await getIdToken(agentServiceUrl);
        headers["Authorization"] = `Bearer ${token}`;
      } catch {
        console.warn("Could not fetch ID token; proceeding without auth");
      }
    }

    const response = await fetch(`${agentServiceUrl}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Agent service error:", response.status, detail);
      return NextResponse.json(
        { error: "Agent service returned an error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ message: data.message });
  } catch (error) {
    console.error("Agent service error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
