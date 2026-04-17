import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HobbyLink",
    short_name: "HobbyLink",
    description: "취미로 연결되는 오프라인 모임 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    icons: [
      {
        src: "/hobbylink-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
