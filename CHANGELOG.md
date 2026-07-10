# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- `StreamPay` contract: continuous USDC payment streams with per-second linear
  vesting, partial withdrawals, and fair cancellation splitting.
- `ouways-sdk`: stream math (`streamedAt` / `withdrawableAt` / `refundableAt`)
  and `createStream` / `withdraw` / `cancelStream` client helpers.
- Next.js site: generative flow-field hero, a premium create-stream card, live
  streams, marketing sections, and docs.

### Deployed

- Arc testnet (chain 5042002): `StreamPay` at
  `0xd981229808c89e1689e025E7c5367d1154F1899D`.
