import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Image prompt is required.",
        },
        {
          status: 400,
        }
      );
    }

    const accountId =
      process.env.CLOUDFLARE_ACCOUNT_ID;

    const apiToken =
      process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            "CLOUDFLARE_ACCOUNT_ID is missing.",
        },
        {
          status: 500,
        }
      );
    }

    if (!apiToken) {
      return NextResponse.json(
        {
          error:
            "CLOUDFLARE_API_TOKEN is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          prompt,

          steps: 4,

          seed: Math.floor(
            Math.random() * 1000000000
          ),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Cloudflare image error:",
        JSON.stringify(data)
      );

      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.message ||
            "Axon couldn't generate the image.",
        },
        {
          status: response.status,
        }
      );
    }

    const base64Image =
      data?.result?.image;

    if (!base64Image) {
      console.error(
        "Cloudflare returned no image:",
        JSON.stringify(data)
      );

      return NextResponse.json(
        {
          error:
            "Cloudflare did not return an image.",
        },
        {
          status: 500,
        }
      );
    }

    const image =
      `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({
      image,
    });
  } catch (error) {
    console.error(
      "Axon image API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Axon couldn't generate the image.",
      },
      {
        status: 500,
      }
    );
  }
}