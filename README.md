# Arma 3 GeoAAR

This project is a Vue.js based web viewer for vector terrain data of Arma 3 maps. It will also provide a new front-end for OCAP2 recording data. At the moment, further development is paused due to lack of time.

## Setup

### Vue BaseURL

The Vue base URL is set in the `vite.config.js` file. This is used to set the base URL for the Vue router. You MUST customize this if it won't be served from the root of the domain.

### OCAP2

[Source](https://github.com/OCAP2)

It's currently **REQUIRED** to be running an OCAP server at the same origin as the viewer. Error page redirect will fail if a request for the recordings list fails and you'll experience a load loop.

To set up a demo server, run the following commands from the project root using Docker.

```shell
cd ocap2
docker build -t ocap-web-testing .
docker run -d --rm -p 5001:5000/tcp --name ocap-web-testing -e OCAP_SECRET="anamaya23" --mount type=bind,src="$(pwd)/static",target=/usr/local/ocap/static --mount type=bind,src="$(pwd)/data",target=/var/lib/ocap/data --mount type=bind,src="$(pwd)/data.db",target=/var/lib/ocap/db/data.db ocap-web-testing:latest
```

A small selection of missions has been provided for demo purposes.

## License

Arma3-GeoAAR, a viewer for Arma 3 map vector tiles and game playback.
Copyright (C) 2023 indigo@indigofox.dev

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
