FROM node:dubnium

EXPOSE 3000

WORKDIR /app

COPY . /app

ENV NODE_ENV production

RUN npm install

RUN ./node_modules/apidoc/bin/apidoc -i routes/ -o doc/

CMD ["npm", "start"]
