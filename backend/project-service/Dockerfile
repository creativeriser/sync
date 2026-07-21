FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app ./
ENV NODE_ENV=production
EXPOSE 5002
CMD ["npm", "start"]
