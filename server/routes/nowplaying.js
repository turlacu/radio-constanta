import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();
const VALID_STATIONS = new Set(['fm', 'folclor']);
const DEFAULT_NOWPLAYING_TOKEN = '9506174b7f6eb7371f8c0c41397fd6cbadce23620bb4aa95fe43ca5b6e8bcab7';
const STATION_ALIASES = new Map([
  ['fm', 'fm'],
  ['radio constanta fm', 'fm'],
  ['radio constanța fm', 'fm'],
  ['constanta fm', 'fm'],
  ['constanța fm', 'fm'],
  ['rcfm', 'fm'],
  ['folclor', 'folclor'],
  ['folklor', 'folclor'],
  ['radio constanta folclor', 'folclor'],
  ['radio constanța folclor', 'folclor'],
  ['constanta folclor', 'folclor'],
  ['constanța folclor', 'folclor'],
  ['rcf', 'folclor'],
]);

const emptyNowPlaying = () => ({
  text: '',
  artist: null,
  title: null,
  updatedAt: null,
});

const latestNowPlaying = {
  fm: emptyNowPlaying(),
  folclor: emptyNowPlaying(),
};

let broadcastUpdate = () => {};
let handleNowPlayingUpdate = () => {};

function getBearerToken(req) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token.trim();
}

function authenticateNowPlaying(req, res, next) {
  const expectedToken = process.env.NOWPLAYING_TOKEN || DEFAULT_NOWPLAYING_TOKEN;
  const token = getBearerToken(req);

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

function normalizeNullableString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeStation(value) {
  if (value === undefined || value === null || value === '') {
    return 'fm';
  }

  const normalized = String(value).trim().toLowerCase();
  return STATION_ALIASES.get(normalized) || null;
}

function getStationFromBody(body) {
  return normalizeStation(
    body.station
      ?? body.stationId
      ?? body.stationName
      ?? body.station_identifier
      ?? body.station_name
      ?? body.STATION_NAME
      ?? body.channel
  );
}

export function setNowPlayingBroadcaster(broadcaster) {
  broadcastUpdate = typeof broadcaster === 'function' ? broadcaster : () => {};
}

export function setNowPlayingUpdateHandler(handler) {
  handleNowPlayingUpdate = typeof handler === 'function' ? handler : () => {};
}

export function getNowPlayingState() {
  return {
    fm: { ...latestNowPlaying.fm },
    folclor: { ...latestNowPlaying.folclor },
  };
}

router.get('/', (req, res) => {
  const station = normalizeStation(req.query.station);

  if (req.query.station) {
    if (!station) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    return res.json({ station, data: { ...latestNowPlaying[station] } });
  }

  res.json(getNowPlayingState());
});

router.post('/update', authenticateNowPlaying, (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'JSON body is required' });
  }

  const station = getStationFromBody(body);
  if (!station || !VALID_STATIONS.has(station)) {
    return res.status(400).json({ error: 'Invalid station' });
  }

  if (typeof body.text !== 'string' || !body.text.trim()) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const text = body.text.trim();
  const previous = latestNowPlaying[station];

  if (previous.text === text) {
    logger.debug('[NowPlaying]', `Duplicate ignored for ${station}: ${text}`);
    return res.json({
      success: true,
      duplicate: true,
      station,
      data: { ...previous },
    });
  }

  const next = {
    text,
    artist: normalizeNullableString(body.artist),
    title: normalizeNullableString(body.title),
    updatedAt: new Date().toISOString(),
  };

  latestNowPlaying[station] = next;
  logger.info('[NowPlaying]', `${station}: ${text}`);

  broadcastUpdate({
    type: 'nowplaying:update',
    station,
    data: next,
  });
  handleNowPlayingUpdate(station, next);

  res.json({
    success: true,
    duplicate: false,
    station,
    data: next,
  });
});

export default router;
