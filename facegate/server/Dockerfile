FROM node:18-bullseye
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm i --production
COPY src ./src
EXPOSE 3001 7001
CMD ["node", "src/index.js"]
