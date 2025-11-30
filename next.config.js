const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const createDebugLogger = (phase) => {
  const endpoint = process.env.NEXT_RUNTIME_DEBUG_ENDPOINT;
  const isDevPhase = phase === PHASE_DEVELOPMENT_SERVER;

  if (!endpoint || !isDevPhase) {
    return null;
  }

  if (endpoint === "console") {
    return (payload) => {
      console.debug("[next.config debug]", {
        ...payload,
        timestamp: Date.now()
      });
    };
  }

  if (typeof fetch !== "function") {
    return null;
  }

  return (payload) => {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        timestamp: Date.now()
      }),
      mode: "no-cors",
      keepalive: true
    }).catch(() => {});
  };
};

/** @type {import('next').NextConfig} */
const nextConfig = (phase) => {
  const sendLog = createDebugLogger(phase);

  if (sendLog) {
    sendLog({
      location: "next.config.js:nextConfig",
      message: "Phase and env detected",
      data: {
        phase,
        isDevPhase: phase === PHASE_DEVELOPMENT_SERVER,
        nodeEnv: process.env.NODE_ENV ?? null
      }
    });
  }

  let hasWebpackLogged = false;

  return {
    webpack: (config, webpackContext) => {
      if (!hasWebpackLogged) {
        hasWebpackLogged = true;
        const { dev, isServer } = webpackContext || {};

        if (sendLog) {
          sendLog({
            location: "next.config.js:webpack",
            message: "Webpack output settings",
            data: {
              dev,
              isServer,
              mode: config.mode ?? null,
              filename: config.output?.filename ?? null,
              chunkFilename: config.output?.chunkFilename ?? null
            }
          });
        }
      }

      return config;
    }
  };
};

module.exports = nextConfig;
