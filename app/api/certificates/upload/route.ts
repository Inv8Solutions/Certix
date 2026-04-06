import crypto from "node:crypto";

import { NextResponse } from "next/server";

type UploadRequestBody = {
  imageData?: unknown;
  eventSlug?: unknown;
  participantName?: unknown;
};

function readEnvValue(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const cloudName = readEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = readEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = readEnvValue(process.env.CLOUDINARY_API_SECRET);

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: "Cloudinary environment variables are missing.",
        },
        { status: 500 },
      );
    }

    if (cloudName === "your_cloud_name") {
      return NextResponse.json(
        {
          error: "Set CLOUDINARY_CLOUD_NAME to your real Cloudinary cloud name.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as UploadRequestBody;
    const imageData = typeof body.imageData === "string" ? body.imageData : "";

    if (!imageData.startsWith("data:image/")) {
      return NextResponse.json(
        {
          error: "Invalid image payload.",
        },
        { status: 400 },
      );
    }

    const eventSlugRaw = typeof body.eventSlug === "string" ? body.eventSlug : "event";
    const participantNameRaw =
      typeof body.participantName === "string" ? body.participantName : "participant";

    const eventSlug = slugify(eventSlugRaw) || "event";
    const participantSlug = slugify(participantNameRaw) || "participant";

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `certix/${eventSlug}`;
    const publicId = `${participantSlug}-${timestamp}`;

    const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(`${signaturePayload}${apiSecret}`)
      .digest("hex");

    const formData = new FormData();
    formData.append("file", imageData);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const uploadResult = (await uploadResponse.json()) as {
      secure_url?: unknown;
      public_id?: unknown;
      error?: { message?: unknown };
    };

    if (!uploadResponse.ok) {
      const errorMessage =
        typeof uploadResult.error?.message === "string"
          ? uploadResult.error.message
          : "Cloudinary upload failed.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: uploadResponse.status },
      );
    }

    return NextResponse.json({
      secureUrl: typeof uploadResult.secure_url === "string" ? uploadResult.secure_url : "",
      publicId: typeof uploadResult.public_id === "string" ? uploadResult.public_id : "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected upload error.",
      },
      { status: 500 },
    );
  }
}
