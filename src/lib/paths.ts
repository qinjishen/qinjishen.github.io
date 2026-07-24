const base = import.meta.env.BASE_URL === "/"
  ? ""
  : import.meta.env.BASE_URL.replace(/\/$/, "");

export function sitePath(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}
