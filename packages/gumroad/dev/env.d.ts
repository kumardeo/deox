declare namespace Cloudflare {
  interface Env {
    readonly GUMROAD_ACCESS_TOKEN: string;
  }
}

interface Env extends Cloudflare.Env {}
