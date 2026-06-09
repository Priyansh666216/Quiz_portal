FROM node:18-slim

# Install Java, Python, GCC, Go
RUN apt-get update && apt-get install -y \
    default-jdk \
    python3 \
    gcc \
    g++ \
    golang \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install
COPY index.js .

EXPOSE 3000
CMD ["node", "index.js"]
