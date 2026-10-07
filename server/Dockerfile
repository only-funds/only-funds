FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 DATA_DIR=/data
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
COPY creator_toolchains/remotion/package.json creator_toolchains/remotion/package.json
RUN npm ci --omit=dev --workspace @onlyfunds/server --ignore-scripts && mkdir /data && chown node:node /data
COPY --chown=node:node server/ server/
COPY --chown=node:node shared/ shared/
USER node
EXPOSE 8787
CMD ["node", "server/index.mjs"]
