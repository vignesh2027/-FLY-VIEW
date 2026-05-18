# FLY-VIEW · ORION Intelligence Globe

> "The world is data. You just need to see it."

A real-time 3D intelligence globe — live flight traffic, cybersecurity threats, breaking AI news.

## Live Demo
[flyview.github.io](https://vignesh2027.github.io/-FLY-VIEW)

## Stack
- **CesiumJS** — 3D globe + terrain
- **MediaPipe Hands** — gesture control
- **adsb.lol / adsb.fi / airplanes.live** — real-time ADS-B flight data
- **AlienVault OTX** — cyber threat intelligence
- **RSS2JSON** — news feeds
- Vanilla JS · No framework

## Controls
| Key | Action |
|-----|--------|
| `1` | ATLAS mode (default) |
| `2` | STORM mode (threats) |
| `3` | TRANSIT mode (flights only) |
| `G` | Toggle gesture panel |
| `ESC` | Close intel panel |

## Gestures (webcam required)
- **Plane** ✈ — index + middle fingers spread (V) → TRANSIT mode + top corridors
- **Shield** 🛡 — flat hand push forward → STORM mode

## Color Language
- **Yellow** `#FFD700` — Active flights & routes
- **Orange** `#FF6600` — Cyber threats
- **White** `#FFFFFF` — UI & labels
- **Black** `#000000` — Background, always
