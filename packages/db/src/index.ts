import DB from './db.js';
import type {
  TupleStorageApi,
  AsyncTupleStorageApi,
} from '@triplit/tuple-database';

export default DB;
export { DB };

type Storage = TupleStorageApi | AsyncTupleStorageApi;
export type { Storage };

export type {
  CollectionNameFromModels,
  ModelFromModels,
  DBConfig,
  FetchByIdQueryParams,
  DBFetchOptions,
  TransactOptions,
} from './db.js';
export type * from './db/types/index.js';

export type { PermissionOperations } from './schema/types/models.js';
export { ChangeTracker, createUpdateProxy } from './db-transaction.js';
export type { DBTransaction } from './db-transaction.js';
export { constructEntity, constructEntities } from './entity.js';
export {
  or,
  and,
  exists,
  compareCursors,
  isFilterGroup,
  isFilterStatement,
  isBooleanFilter,
} from './query.js';
export {
  QUERY_INPUT_TRANSFORMERS,
  RelationBuilder,
  relationBuilder,
} from './query/builder.js';
export * from './db-helpers.js';
export type {
  TripleRow,
  EntityId,
  Attribute,
  TupleValue,
} from './triple-store-utils.js';
export type { TripleStoreApi, ClearOptions } from './triple-store.js';
export {
  triplesToSchema,
  JSONToSchema,
  hashSchemaJSON,
  getSchemaFromPath,
  getDefaultValuesForCollection,
} from './schema/schema.js';
export {
  getRolesFromSession,
  normalizeSessionVars,
  getCollectionPermissions,
  sessionRolesAreEquivalent,
} from './schema/permissions.js';
export { Schema } from './schema/builder.js';
export { diffSchemas, getSchemaDiffIssues } from './schema/diff.js';
export type { TObject } from './schema/schema.js';
export { typeFromJSON } from './schema/serialization.js';
export * from './schema/types/index.js';
export type { SchemaDefinition as SchemaJSON } from './schema/types/index.js';
export { timestampCompare } from './timestamp.js';
export type { Timestamp } from './timestamp.js';
export { DurableClock } from './clocks/durable-clock.js';
export { MemoryClock } from './clocks/memory-clock.js';
export {
  default as CollectionQueryBuilder,
  convertEntityToJS,
} from './collection-query.js';
export { QueryBuilder } from './query/builder.js';
export type * from './query/types/index.js';
export { default as Builder } from './utils/builder.js';
export type { toBuilder } from './utils/builder.js';
export type { IsAny } from './utility-types.js';
export * from './errors.js';
// See ./data-types/index.ts for why this is necessary
export * from './data-types/index.js';
export * from './data-types/types/index.js';
export * from './data-types/constants.js';
export * from './schema/export/index.js';
export * from './schema/import/index.js';
export * from './utils/generator.js';

export * from './utils/query.js';
export * from './query/execution-cache.js';

// Super Schema Exports
export { processSuperSchema } from './schema/super-schema/process-super-schema.js';
export { zodAdapter } from './schema/super-schema/adapters/zod.js';
export type { SuperSchema } from 'packages/db/src/schema/super-schema/SuperSchema.js';
