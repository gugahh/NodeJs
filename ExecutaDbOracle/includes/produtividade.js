/**
 * produtividade.js
 * Throughput tracking utility for Node.js programs.
 */

/**
 * Calculates processing throughput based on item count and elapsed time.
 *
 * @param {number} item_quantity - Number of items processed
 * @param {Date|number} init_time - Start time (Date object or ms timestamp)
 * @param {Date|number} end_time  - End time  (Date object or ms timestamp)
 * @returns {{ itemsPerMinute: number, itemsPerHour: number }}
 */
function fc_produtividade(item_quantity, init_time, end_time) {
  const startMs = init_time instanceof Date ? init_time.getTime() : init_time;
  const endMs   = end_time  instanceof Date ? end_time.getTime()  : end_time;

  const elapsedMs = endMs - startMs;

  if (elapsedMs <= 0) {
    throw new Error('end_time must be greater than init_time');
  }

  const elapsedMinutes = elapsedMs / 60_000;

  const itemsPerMinute = item_quantity / elapsedMinutes;
  const itemsPerHour   = itemsPerMinute * 60;

  return {
    itemsPerMinute: Math.round(itemsPerMinute * 10_000) / 10_000,
    itemsPerHour:   Math.round(itemsPerHour   * 10_000) / 10_000,
  };
}

module.exports = { fc_produtividade };
