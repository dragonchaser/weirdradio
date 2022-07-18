
[![Build Status](https://drone.services.datenschmutz.space/api/badges/dragonchaser/weirdradio/status.svg)](https://drone.services.datenschmutz.space/dr

# Weirdradio

Weirdradio is a matrix bot that will queue youtube videos into a webfrontend for listening.
This can be used as party juke box (especially in combination with the whatsapp or signal bridge).

**NOTE:** The software is WIP, expect breaking changes, weird behaviour and gargoyle spitting wormholes!

## License

MIT see [LICENSE](https://github.com/dragonchaser/matrix-feeder/blob/master/LICENSE) file in this repository.

## Run

```
$> docker build . -t local/weirdradio:latest
$> docker run -it \
    -p8090:8090 \
    -p8080:8080 \
    -v $(pwd)/config:/weirdradio/config \
    local/weirdradio:latest
```