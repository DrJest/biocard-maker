FROM node:16

RUN git clone https://github.com/DrJest/biocard-maker.git && cd biocard-maker && npm install

CMD [ "node", "biocard-maker/app.js" ]