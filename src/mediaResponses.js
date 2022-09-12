const fs = require('fs');
const path = require('path');

const respond = (request, response, contentType, start, end, total) => {
  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': (end - start) + 1,
    'Content-Type': contentType,
  });
};

const getRange = (request, stats) => {
  const values = {};
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');

  values.start = parseInt(positions[0], 10);

  values.total = stats.size;
  values.end = positions[1] ? parseInt(positions[1], 10) : values.total - 1;

  if (values.start > values.end) {
    values.start = values.end - 1;
  }
  return values;
};

const getStream = (request, response, file, start, end) => {
  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

const streaming = (request, response, file, contentType) => {
  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const { start, end, total } = getRange(request, stats);

    respond(request, response, contentType, start, end, total);

    return getStream(request, response, file, start, end);
  });
};

const getParty = (request, response) => {
  const file = path.resolve(__dirname, '../client/party.mp4');
  streaming(request, response, file, 'video/mp4 ');
};

const getBling = (request, response) => {
  const file = path.resolve(__dirname, '../client/bling.mp3');
  streaming(request, response, file, 'audio/mp3');
};

const getBird = (request, response) => {
  const file = path.resolve(__dirname, '../client/bird.mp4');
  streaming(request, response, file, 'video/mp4 ');
};

module.exports = {
  getParty,
  getBling,
  getBird,
};
