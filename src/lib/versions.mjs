/**
 * Java LTS registry (S11, S16).
 *
 * This is the only place where the supported releases are declared. Chapter
 * frontmatter validates `since` and `hasta` against it, and the version
 * reading mode (S16) filters by the same list. Only LTS releases belong here:
 * a reading mode that covered every release would need one branch per release
 * and would multiply the maintenance cost (S11).
 *
 * Plain JavaScript on purpose, like the section registry: the content schema
 * and any Node script read it without a TypeScript loader, and the types live
 * in JSDoc.
 */

/**
 * One supported Java release.
 *
 * @typedef {object} JavaVersion
 * @property {number} version Numeric release used in frontmatter and comparisons.
 * @property {string} label Reader-facing name, for example `Java 8`.
 */

/** @type {readonly JavaVersion[]} */
export const versions = [
  { version: 8, label: 'Java 8' },
  { version: 11, label: 'Java 11' },
  { version: 17, label: 'Java 17' },
  { version: 21, label: 'Java 21' },
  { version: 25, label: 'Java 25' },
];

/** LTS release numbers in ascending order, for validation and filtering. */
export const ltsVersions = versions.map((release) => release.version);

/**
 * Whether a value is one of the supported LTS releases.
 *
 * @param {number} version
 * @returns {boolean}
 */
export function isLtsVersion(version) {
  return ltsVersions.includes(version);
}

/**
 * Resolve a release, or `undefined` when it is not LTS.
 *
 * @param {number} version
 * @returns {JavaVersion | undefined}
 */
export function findVersion(version) {
  return versions.find((release) => release.version === version);
}

/**
 * Reader-facing name of a release. Values outside the registry fall back to
 * the plain number so a rendering path can never throw; validation is the job
 * of the content schema, not of this function.
 *
 * @param {number} version
 * @returns {string}
 */
export function versionLabel(version) {
  return findVersion(version)?.label ?? `Java ${version}`;
}
