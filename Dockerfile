# Build stage
FROM node:alpine as build-stage

COPY . /app
WORKDIR /app

COPY package.json package.json

RUN npm install --silent
RUN npm run build

# Production stage
FROM node:alpine as production-stage

COPY --from=build-stage /app /app

WORKDIR /app
CMD ["npm", "start"]

EXPOSE 3000