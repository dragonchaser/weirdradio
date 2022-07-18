FROM node:latest
LABEL maintainer="dragonchaser <weirdradio@datenschmutz.space>"
RUN git clone https://github.com/dragonchaser/weirdradio /weirdradio
WORKDIR /weirdradio
RUN npm install
CMD node weirdradio