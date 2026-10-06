/** woff2 imports resolve to a URL served by the Remotion bundler. */
declare module '*.woff2' {
  const url: string;
  export default url;
}
