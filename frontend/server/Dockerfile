FROM node:18-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json /app/
RUN npm install

COPY . /app

EXPOSE 5001

CMD ["npm", "start"]
