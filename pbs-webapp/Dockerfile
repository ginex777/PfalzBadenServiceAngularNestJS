FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g npm@10.9.0

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx ng build --configuration=production

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/pbs-webapp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
