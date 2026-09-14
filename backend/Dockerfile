FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

# 云托管会注入 PORT，代码里已使用 process.env.PORT
EXPOSE 80

CMD ["npm", "start"]
