# base image
FROM node:lts

# make working dir
RUN mkdir -p /app
WORKDIR /app

# install dependencies
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

# copy source files
COPY app.ts .
COPY /src ./src

# copy ts config
COPY ./tsconfig.json .

# build typescript
RUN npm run build

# copy templates
RUN npm run copy-templates

# start server
CMD [ "node", "/app/dist/app.js" ]