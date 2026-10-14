FROM node

WORKDIR /app

COPY package*.json .
RUN npm install
# COPY index.js index.js , we cant do this because we have multiple files in the directory so we will copy all the files using below command
COPY . .




CMD ["node", "index.js"]