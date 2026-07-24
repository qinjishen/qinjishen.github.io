import { defineConfig } from "astro/config";

const [owner = "", repository = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isGitHubPages = Boolean(owner && repository);
const isUserSite = repository.toLowerCase() === `${owner.toLowerCase()}.github.io`;

export default defineConfig({
  site: isGitHubPages ? `https://${owner}.github.io` : "http://localhost:4321",
  base: isGitHubPages && !isUserSite ? `/${repository}` : "/",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
