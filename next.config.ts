import type { NextConfig } from "next";
import { execSync } from "child_process";

function getDeployDate(): string {
  if (process.env.NEXT_PUBLIC_DEPLOY_DATE) {
    return process.env.NEXT_PUBLIC_DEPLOY_DATE;
  }

  const rawDate =
    process.env.VERCEL_GIT_COMMIT_DATE ||
    (() => {
      try {
        return execSync("git log -1 --format=%cI", { encoding: "utf-8" }).trim();
      } catch {
        return new Date().toISOString();
      }
    })();

  try {
    const d = new Date(rawDate);
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "2026";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOY_DATE: getDeployDate(),
  },
};

export default nextConfig;

